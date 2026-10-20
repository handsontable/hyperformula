import type { EventScope } from "../../events/eventManager";
import { CN } from "../../theme/classNames";
import { createEl } from "../dom";
import { BasePopup } from "./basePopup";
import { EndViewportAnchoredStrategy } from "./positionStrategy";
import type { BoundsRect, ErrorOptions, LayoutDirection } from "./types";

export interface ErrorPopupOptions {
  container: HTMLElement;
  options?: ErrorOptions;
  direction?: LayoutDirection;
}

let errorPopupIdCounter = 0;

export class ErrorPopup extends BasePopup {
  private container: HTMLElement | null = null;
  private containerScope: EventScope | null = null;
  private activeCell: HTMLElement | null = null;
  private pointerCell: HTMLElement | null = null;
  private focusCell: HTMLElement | null = null;
  private suppressedCell: HTMLElement | null = null;
  private pendingMessage = "";
  private scrollFrame: number | null = null;
  private readonly direction: LayoutDirection;
  private readonly onOver = (event: MouseEvent): void => this.handleEnter(event.target, true);
  private readonly onOut = (event: MouseEvent): void => this.handleLeave(event.relatedTarget, true);
  private readonly onFocusIn = (event: FocusEvent): void => this.handleEnter(event.target, false);
  private readonly onFocusOut = (event: FocusEvent): void =>
    this.handleLeave(event.relatedTarget, false);
  private readonly onScroll = (): void => this.scheduleScrollReposition();
  private readonly onKeydown = (event: KeyboardEvent): void => this.handleEscape(event);

  constructor({ container, options, direction }: ErrorPopupOptions) {
    super({
      strategy: new EndViewportAnchoredStrategy(),
      container,
      showClose: options?.showClose ?? false,
    });
    this.direction = direction ?? "ltr";
    errorPopupIdCounter += 1;
    this.root.id = `${CN.errorPopup}-${errorPopupIdCounter}`;
  }

  protected createRoot(): HTMLElement {
    return createEl("div", { class: CN.errorPopup, role: "tooltip", hidden: true });
  }

  protected override getBounds(): BoundsRect | undefined {
    return this.container?.getBoundingClientRect();
  }

  protected renderContent(): void {
    const separatorIndex = this.pendingMessage.indexOf(" — ");

    if (separatorIndex === -1) {
      this.root.appendChild(createEl("div", { class: CN.errorPopupTitle }, [this.pendingMessage]));
    } else {
      const title = this.pendingMessage.slice(0, separatorIndex);
      const body = this.pendingMessage.slice(separatorIndex + 3);

      this.root.appendChild(createEl("div", { class: CN.errorPopupTitle }, [title]));
      this.root.appendChild(createEl("div", { class: CN.errorPopupMessage }, [body]));
    }
  }

  private handleEscape(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !this.isVisible() || this.builderSurfaceHasFocus()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.suppressedCell = this.activeCell;
    this.close();
  }

  private builderSurfaceHasFocus(): boolean {
    const active = document.activeElement;

    return (
      active instanceof HTMLElement &&
      active.closest(`.${CN.editor}, .${CN.fnHelp}, .${CN.formulaBar}`) !== null
    );
  }

  private markerFrom(target: EventTarget | null): HTMLElement | null {
    const element = target instanceof HTMLElement ? target : null;

    if (!element) {
      return null;
    }

    const ancestor = element.closest<HTMLElement>("[data-hfe-error]");

    if (ancestor) {
      return ancestor;
    }

    for (const child of element.children) {
      if (child instanceof HTMLElement && child.dataset.hfeError !== undefined) {
        return child;
      }
    }

    return null;
  }

  private clearErrorAssociation(): void {
    this.activeCell?.removeAttribute("aria-errormessage");
  }

  private handleEnter(target: EventTarget | null, viaPointer: boolean): void {
    const cell = this.markerFrom(target);

    if (!cell) {
      return;
    }

    const message = cell.dataset.hfeError;

    if (!message) {
      return;
    }

    if (viaPointer) {
      this.pointerCell = cell;
    } else {
      this.focusCell = cell;
    }

    if (cell === this.suppressedCell) {
      if (this.isVisible() && this.activeCell !== cell) {
        this.close();
      }

      return;
    }

    this.anchorTo(cell, message);
  }

  private anchorTo(cell: HTMLElement, message: string): void {
    this.pendingMessage = message;
    this.clearErrorAssociation();
    this.activeCell = cell;
    const rect = cell.getBoundingClientRect();
    this.open({
      left: rect.left,
      top: rect.top,
      height: rect.height,
      width: rect.width,
      direction: this.direction,
    });
    cell.setAttribute("aria-errormessage", this.root.id);
  }

  private anchorToRemainingCell(): boolean {
    const cell = this.pointerCell ?? this.focusCell;

    if (!cell || cell === this.activeCell) {
      return true;
    }

    const message = cell.dataset.hfeError;

    if (cell === this.suppressedCell || !message) {
      return false;
    }

    this.anchorTo(cell, message);

    return true;
  }

  private pruneDetachedCells(): void {
    if (this.activeCell && !this.activeCell.isConnected) {
      this.clearErrorAssociation();
      this.activeCell = null;
    }

    if (this.pointerCell && !this.pointerCell.isConnected) {
      this.pointerCell = null;
    }

    if (this.focusCell && !this.focusCell.isConnected) {
      this.focusCell = null;
    }

    if (this.suppressedCell && !this.suppressedCell.isConnected) {
      this.suppressedCell = null;
    }
  }

  private handleLeave(relatedTarget: EventTarget | null, viaPointer: boolean): void {
    this.pruneDetachedCells();

    const related = relatedTarget as HTMLElement | null;
    const staysInside = Boolean(
      related?.closest("[data-hfe-error]") || (related && this.contains(related)),
    );

    if (staysInside) {
      return;
    }

    if (viaPointer) {
      this.pointerCell = null;
    } else {
      this.focusCell = null;
    }

    if (
      this.isVisible() &&
      (this.pointerCell !== null || this.focusCell !== null) &&
      this.anchorToRemainingCell()
    ) {
      return;
    }

    const suppressedStillHeld =
      this.suppressedCell !== null &&
      (this.suppressedCell.contains(document.activeElement) ||
        this.pointerCell === this.suppressedCell ||
        this.focusCell === this.suppressedCell);

    if (!suppressedStillHeld) {
      this.suppressedCell = null;
    }

    this.clearErrorAssociation();
    this.activeCell = null;
    this.close();
  }

  private scheduleScrollReposition(): void {
    if (this.scrollFrame !== null) {
      return;
    }

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = null;
      this.handleScroll();
    });
  }

  private cancelScrollReposition(): void {
    if (this.scrollFrame === null) {
      return;
    }

    cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = null;
  }

  private handleScroll(): void {
    if (!this.isVisible() || !this.activeCell) {
      return;
    }

    const rect = this.activeCell.getBoundingClientRect();
    this.reposition({
      left: rect.left,
      top: rect.top,
      height: rect.height,
      width: rect.width,
      direction: this.direction,
    });
  }

  attach(container: HTMLElement): void {
    this.detach();
    this.container = container;
    this.containerScope = this.events.createScope("error-host");
    this.containerScope.listen(container, "mouseover", this.onOver);
    this.containerScope.listen(container, "mouseout", this.onOut);
    this.containerScope.listen(container, "focusin", this.onFocusIn);
    this.containerScope.listen(container, "focusout", this.onFocusOut);
    this.containerScope.listen(this.root, "mouseout", this.onOut);
    this.containerScope.listen(this.root, "focusout", this.onFocusOut);
    this.containerScope.listen(window, "scroll", this.onScroll, { capture: true });
    this.containerScope.listen(window, "keydown", this.onKeydown, { capture: true });
    this.containerScope.activate();
  }

  protected override onVisibilityChanged(visible: boolean): void {
    if (!visible) {
      this.pruneDetachedCells();
      this.clearErrorAssociation();
      this.activeCell = null;
    }
  }

  protected override onExplicitClosed(): void {
    super.onExplicitClosed();
    this.pointerCell = null;
    this.focusCell = null;
  }

  detach(): void {
    if (!this.container) {
      return;
    }

    this.cancelScrollReposition();
    this.containerScope?.dispose();
    this.containerScope = null;
    this.container = null;
    this.clearErrorAssociation();
    this.activeCell = null;
    this.pointerCell = null;
    this.focusCell = null;
    this.suppressedCell = null;
    this.close();
  }

  override destroy(): void {
    this.cancelScrollReposition();
    super.destroy();
  }
}
