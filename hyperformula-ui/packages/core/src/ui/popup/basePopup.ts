import { EventManager, type EventScope } from "../../events/eventManager";
import type { DomEventOptions } from "../../events/types";
import { CN } from "../../theme/classNames";
import { clear, createEl, createSvgIcon } from "../dom";
import { CLOSE_BUTTON } from "../icons";
import { BottomViewportAnchoredStrategy } from "./positionStrategy";
import type { AnchorRect, BoundsRect, PositionStrategy, Viewport } from "./types";

interface BasePopupOptions {
  strategy?: PositionStrategy;
  container?: HTMLElement;
  showClose?: boolean;
  onExplicitClose?: () => void;
}

export abstract class BasePopup {
  protected readonly root: HTMLElement;
  protected readonly events = new EventManager();
  private readonly strategy: PositionStrategy;
  private visible = false;
  private readonly closeButton: HTMLButtonElement | null;
  private readonly staticScope: EventScope;
  private renderScope: EventScope | null = null;
  private attachedToHost = false;
  private hostThemeClassName: string | null = null;
  private readonly homeContainer: HTMLElement;
  private readonly explicitCloseCallback: (() => void) | undefined;
  private readonly onRootMouseDown = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  constructor({
    strategy = new BottomViewportAnchoredStrategy(),
    container = document.body,
    showClose = false,
    onExplicitClose,
  }: BasePopupOptions = {}) {
    this.strategy = strategy;
    this.root = this.createRoot();
    this.root.classList.add(CN.popup);
    this.staticScope = this.events.createScope("popup-static");
    this.staticScope.listen(this.root, "mousedown", this.onRootMouseDown);
    this.explicitCloseCallback = onExplicitClose;
    this.closeButton = showClose ? this.createCloseButton() : null;
    this.staticScope.activate();
    this.homeContainer = container;
    container.appendChild(this.root);
  }

  private createCloseButton(): HTMLButtonElement {
    const button = createEl("button", {
      class: CN.popupClose,
      type: "button",
      "aria-label": "Close",
    });
    button.appendChild(createSvgIcon(CLOSE_BUTTON) as unknown as HTMLElement);
    this.staticScope.listen(button, "mousedown", (event) => {
      event.preventDefault();
      this.close();
      this.onExplicitClosed();
    });
    this.staticScope.listen(button, "keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.close();
        this.onExplicitClosed();
      }
    });

    return button;
  }

  protected abstract createRoot(): HTMLElement;

  protected abstract renderContent(): void;

  protected onVisibilityChanged(_visible: boolean): void {}

  protected onExplicitClosed(): void {
    this.explicitCloseCallback?.();
  }

  protected getBounds(): BoundsRect | undefined {
    return undefined;
  }

  protected renderListen<EventName extends keyof GlobalEventHandlersEventMap>(
    target: EventTarget,
    type: EventName,
    handler: (event: GlobalEventHandlersEventMap[EventName]) => void,
    opts?: DomEventOptions,
  ): void {
    this.renderScope?.listen(target, type, handler, opts);
  }

  open(anchor: AnchorRect): void {
    const wasVisible = this.visible;

    clear(this.root);
    this.renderScope?.dispose();
    this.renderScope = this.events.createScope("popup-render");
    this.renderContent();
    this.renderScope.activate();

    if (this.closeButton && !this.attachedToHost) {
      this.root.appendChild(this.closeButton);
    }

    this.root.hidden = false;
    this.visible = true;
    this.reposition(anchor);

    if (!wasVisible) {
      this.onVisibilityChanged(true);
    }
  }

  reposition(anchor: AnchorRect): void {
    if (!this.visible || this.attachedToHost) {
      return;
    }

    this.root.style.maxHeight = "";
    this.root.style.maxWidth = "";

    const popupRect = this.root.getBoundingClientRect();
    const viewport: Viewport = { width: window.innerWidth, height: window.innerHeight };
    const position = this.strategy.compute(anchor, popupRect, viewport, this.getBounds());
    this.root.style.left = `${position.left}px`;
    this.root.style.top = `${position.top}px`;
    this.root.style.maxHeight = position.maxHeight === undefined ? "" : `${position.maxHeight}px`;
    this.root.style.maxWidth = position.maxWidth === undefined ? "" : `${position.maxWidth}px`;
  }

  attachToHost(container: HTMLElement, themeClassName?: string): void {
    this.attachedToHost = true;
    this.root.classList.add(CN.popupHosted);

    if (this.hostThemeClassName !== null && this.hostThemeClassName !== themeClassName) {
      this.root.classList.remove(this.hostThemeClassName);
      this.hostThemeClassName = null;
    }

    if (themeClassName !== undefined) {
      this.hostThemeClassName = themeClassName;
      this.root.classList.add(themeClassName);
    }

    this.root.style.left = "";
    this.root.style.top = "";
    this.root.style.maxHeight = "";
    this.closeButton?.remove();
    container.appendChild(this.root);
  }

  detachFromHost(): void {
    if (!this.attachedToHost) {
      return;
    }

    this.close();
    this.attachedToHost = false;
    this.root.classList.remove(CN.popupHosted);

    if (this.hostThemeClassName !== null) {
      this.root.classList.remove(this.hostThemeClassName);
      this.hostThemeClassName = null;
    }

    this.homeContainer.appendChild(this.root);
  }

  get isAttachedToHost(): boolean {
    return this.attachedToHost;
  }

  close(): void {
    if (!this.visible) {
      return;
    }

    this.visible = false;
    this.root.hidden = true;
    clear(this.root);
    this.renderScope?.dispose();
    this.renderScope = null;
    this.onVisibilityChanged(false);
  }

  destroy(): void {
    this.close();
    this.events.disposeAll();
    this.root.remove();
  }

  isVisible(): boolean {
    return this.visible;
  }

  contains(node: Node): boolean {
    return this.root.contains(node);
  }
}
