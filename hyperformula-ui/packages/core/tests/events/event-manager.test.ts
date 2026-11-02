import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventManager } from "../../src/events/eventManager";

function makeTarget() {
  const listeners: Array<{ type: string; handler: EventListener; capture: boolean }> = [];
  const target = {
    addEventListener: vi.fn(
      (type: string, handler: EventListener, opts?: boolean | AddEventListenerOptions) => {
        const capture = typeof opts === "boolean" ? opts : (opts?.capture ?? false);
        listeners.push({ type, handler, capture });
      },
    ),
    removeEventListener: vi.fn(),
    listeners,
    fire(type: string, event: Partial<Event>) {
      for (const entry of listeners.filter((l) => l.type === type)) {
        entry.handler(event as Event);
      }
    },
  };
  return target;
}

describe("EventManager", () => {
  let manager: EventManager;

  beforeEach(() => {
    manager = new EventManager();
  });
  afterEach(() => {
    manager.disposeAll();
  });

  it("does not bind DOM listeners until activate()", () => {
    const target = makeTarget();
    const scope = manager.createScope("test");
    scope.listen(target as unknown as EventTarget, "click", () => {});
    expect(target.addEventListener).not.toHaveBeenCalled();
    scope.activate();
    expect(target.addEventListener).toHaveBeenCalledWith("click", expect.any(Function), {
      capture: false,
    });
  });

  it("binds a dom() listener immediately when the scope is already active", () => {
    const target = makeTarget();
    const scope = manager.createScope("test");
    scope.activate();
    scope.listen(target as unknown as EventTarget, "click", () => {});
    expect(target.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("removeEventListener uses the same capture flag as addEventListener", () => {
    const target = makeTarget();
    const scope = manager.createScope("test", { capture: true });
    const handler = () => {};
    scope.listen(target as unknown as EventTarget, "scroll", handler);
    scope.activate();
    scope.deactivate();
    const removeArgs = target.removeEventListener.mock.calls[0];
    expect(removeArgs?.[2]).toEqual({ capture: true });
  });

  it("applies scope stopPropagation policy after the handler runs", () => {
    const target = makeTarget();
    const scope = manager.createScope("guard", { stopPropagation: true });
    const userHandler = vi.fn();
    scope.listen(target as unknown as EventTarget, "keydown", userHandler);
    scope.activate();
    const event = { stopPropagation: vi.fn(), preventDefault: vi.fn() };
    target.fire("keydown", event);
    expect(userHandler).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("per-call opts override scope policy", () => {
    const target = makeTarget();
    const scope = manager.createScope("guard", { stopPropagation: true });
    scope.listen(target as unknown as EventTarget, "mousedown", () => {}, {
      stopPropagation: false,
      preventDefault: true,
    });
    scope.activate();
    const event = { stopPropagation: vi.fn(), preventDefault: vi.fn() };
    target.fire("mousedown", event);
    expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it("double activate is a no-op", () => {
    const target = makeTarget();
    const scope = manager.createScope("test");
    scope.listen(target as unknown as EventTarget, "click", () => {});
    scope.activate();
    scope.activate();
    expect(target.addEventListener).toHaveBeenCalledTimes(1);
    expect(scope.isActive()).toBe(true);
  });

  it("isolates a throwing handler and still runs siblings", () => {
    const target = makeTarget();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const scope = manager.createScope("test");
    const sibling = vi.fn();
    scope.listen(target as unknown as EventTarget, "click", () => {
      throw new Error("boom");
    });
    scope.listen(target as unknown as EventTarget, "click", sibling);
    scope.activate();
    target.fire("click", {});
    expect(sibling).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("disposes added disposables and is safe to dispose twice", () => {
    const scope = manager.createScope("test");
    const disposable = { dispose: vi.fn() };
    scope.add(disposable);
    scope.dispose();
    scope.dispose();
    expect(disposable.dispose).toHaveBeenCalledOnce();
  });

  it("disposeAll tears down every scope", () => {
    const target = makeTarget();
    const scope = manager.createScope("test");
    scope.listen(target as unknown as EventTarget, "click", () => {});
    scope.activate();
    manager.disposeAll();
    expect(target.removeEventListener).toHaveBeenCalledOnce();
    expect(scope.isActive()).toBe(false);
  });

  it("drops a disposed scope from the manager so disposeAll does not re-dispose it", () => {
    const first = manager.createScope("first");
    const disposable = { dispose: vi.fn() };
    first.add(disposable);
    first.dispose();
    expect(disposable.dispose).toHaveBeenCalledOnce();
    manager.disposeAll();
    expect(disposable.dispose).toHaveBeenCalledOnce();
  });
});
