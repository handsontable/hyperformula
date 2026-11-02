import type { Disposable, DomEventOptions, ScopePolicy } from "./types";

interface DomRegistration {
  target: EventTarget;
  type: string;
  wrapped: EventListener;
  capture: boolean;
  passive: boolean | undefined;
  bound: boolean;
}

/**
 * One named lifecycle unit of listeners: DOM registrations bind on `activate()`, unbind on
 * `deactivate()`, and everything (including non-DOM `Disposable`s) tears down on `dispose()`.
 * Capture-flag symmetry is handled internally — registration stores the resolved capture
 * value, so removal always matches.
 *
 * @category Events
 */
export class EventScope {
  private readonly domRegistrations: DomRegistration[] = [];
  private readonly disposables: Disposable[] = [];
  private active = false;
  private disposed = false;

  constructor(
    private readonly name: string,
    private readonly policy: ScopePolicy = {},
    private readonly onScopeDispose?: () => void,
  ) {}

  private bindOne(registration: DomRegistration): void {
    if (registration.bound) {
      return;
    }

    const addOptions: AddEventListenerOptions = { capture: registration.capture };

    if (registration.passive !== undefined) {
      addOptions.passive = registration.passive;
    }

    registration.target.addEventListener(registration.type, registration.wrapped, addOptions);
    registration.bound = true;
  }

  private unbindOne(registration: DomRegistration): void {
    if (!registration.bound) {
      return;
    }

    registration.target.removeEventListener(registration.type, registration.wrapped, {
      capture: registration.capture,
    });
    registration.bound = false;
  }

  /**
   * Registers a DOM listener on `target`; binds immediately when the scope is active,
   * otherwise on the next `activate()`. Per-listener options override the scope policy.
   */
  listen<K extends keyof GlobalEventHandlersEventMap>(
    target: EventTarget,
    type: K,
    handler: (event: GlobalEventHandlersEventMap[K]) => void,
    opts: DomEventOptions = {},
  ): void {
    const capture = opts.capture ?? this.policy.capture ?? false;
    const stopPropagation = opts.stopPropagation ?? this.policy.stopPropagation ?? false;
    const preventDefault = opts.preventDefault ?? this.policy.preventDefault ?? false;

    const wrapped = (event: Event): void => {
      try {
        handler(event as GlobalEventHandlersEventMap[K]);
      } catch (error) {
        console.error(`EventScope "${this.name}" handler for "${type}" threw:`, error);
      }

      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }
    };

    const registration: DomRegistration = {
      target,
      type,
      wrapped,
      capture,
      passive: opts.passive,
      bound: false,
    };
    this.domRegistrations.push(registration);

    if (this.active) {
      this.bindOne(registration);
    }
  }

  /** Registers non-DOM teardown (subscriptions, timers) to run on `dispose()`. */
  add(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  /** Binds all registered DOM listeners. No-op when already active or disposed. */
  activate(): void {
    if (this.active || this.disposed) {
      return;
    }

    this.active = true;

    for (const registration of this.domRegistrations) {
      this.bindOne(registration);
    }
  }

  /** Unbinds all DOM listeners but keeps registrations for a later `activate()`. */
  deactivate(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    for (const registration of this.domRegistrations) {
      this.unbindOne(registration);
    }
  }

  /** Deactivates, runs every registered `Disposable`, and unregisters from the manager. */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.deactivate();
    this.disposed = true;
    this.domRegistrations.length = 0;

    for (const disposable of this.disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error(`EventScope "${this.name}" disposable threw:`, error);
      }
    }

    this.disposables.length = 0;
    this.onScopeDispose?.();
  }

  /** Whether the scope's DOM listeners are currently bound. */
  isActive(): boolean {
    return this.active;
  }
}

/**
 * Registry of {@link EventScope}s for one lifecycle owner. Each owner constructs its own
 * instance — there is no global manager.
 *
 * @category Events
 */
export class EventManager {
  private readonly scopes: EventScope[] = [];

  /** Creates and tracks a named scope; `policy` sets its listener defaults. */
  createScope(name: string, policy?: ScopePolicy): EventScope {
    const scope = new EventScope(name, policy, () => {
      const index = this.scopes.indexOf(scope);

      if (index !== -1) {
        this.scopes.splice(index, 1);
      }
    });
    this.scopes.push(scope);

    return scope;
  }

  /** Disposes every tracked scope. */
  disposeAll(): void {
    for (const scope of [...this.scopes]) {
      scope.dispose();
    }

    this.scopes.length = 0;
  }
}
