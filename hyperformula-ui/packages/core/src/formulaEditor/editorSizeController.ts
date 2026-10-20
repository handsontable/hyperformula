import type { EventScope } from "../events/eventManager";
import { CN } from "../theme/classNames";
import { findAncestor } from "../ui/dom";

interface ResolvedClip {
  element: HTMLElement;
  left: number;
  top: number;
}

interface LineMetrics {
  lineHeight: number;
  paddingVertical: number;
}

export class EditorSizeController {
  private deferredFrame = 0;
  private scheduledFrame = 0;
  private resizeObserver: ResizeObserver | null = null;
  private appliedMinHeight = false;
  private cachedClip: HTMLElement | null | undefined;
  private cachedLineMetrics: LineMetrics | undefined;

  private readonly handleAmbientResize = (): void => this.requestUpdateFrame();

  constructor(
    private readonly rootEl: HTMLElement,
    private readonly overlayEl: HTMLElement,
    private readonly inputEl: HTMLElement,
    private readonly scope: EventScope,
    private readonly onRootResize?: () => void,
  ) {}

  private requestUpdateFrame(): void {
    if (typeof requestAnimationFrame !== "function") {
      this.update();

      return;
    }

    if (this.scheduledFrame) {
      return;
    }

    this.scheduledFrame = requestAnimationFrame(() => {
      this.scheduledFrame = 0;
      this.update();
    });
  }

  private measureContentHeight(): number {
    const previousHeight = this.inputEl.style.height;
    const previousScrollTop = this.inputEl.scrollTop;

    this.inputEl.style.height = "0";

    const contentHeight = this.inputEl.scrollHeight;

    this.inputEl.style.height = previousHeight;
    this.inputEl.scrollTop = previousScrollTop;

    return contentHeight;
  }

  private mirrorContentHeight(): number {
    this.overlayEl.style.paddingBottom = "";

    const contentHeight = this.measureContentHeight();
    const deficit = contentHeight - this.overlayEl.scrollHeight;

    if (deficit > 0) {
      const basePadding = Number.parseFloat(getComputedStyle(this.overlayEl).paddingBottom) || 0;

      this.overlayEl.style.paddingBottom = `${basePadding + deficit}px`;
    }

    return contentHeight;
  }

  private availableWidth(
    clip: ResolvedClip,
    rootRect: DOMRect,
    rootStyle: CSSStyleDeclaration,
  ): number {
    const hostWidthCap = Number.parseFloat(rootStyle.getPropertyValue("--hfe-editor-max-width"));
    const clipWidth =
      rootStyle.direction === "rtl"
        ? rootRect.right - (clip.left + clip.element.clientLeft)
        : clip.left + clip.element.clientLeft + clip.element.clientWidth - rootRect.left;

    if (Number.isNaN(hostWidthCap) || hostWidthCap <= 0) {
      return clipWidth;
    }

    return Math.min(clipWidth, hostWidthCap);
  }

  private measureLineHeight(inputStyle: CSSStyleDeclaration): number {
    const probe = this.rootEl.ownerDocument.createElement("div");

    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.padding = "0";
    probe.style.border = "0";
    probe.style.fontFamily = inputStyle.fontFamily;
    probe.style.fontSize = inputStyle.fontSize;
    probe.style.fontWeight = inputStyle.fontWeight;
    probe.style.letterSpacing = inputStyle.letterSpacing;
    probe.style.lineHeight = inputStyle.lineHeight;
    probe.textContent = "M";
    this.rootEl.appendChild(probe);

    const height = probe.getBoundingClientRect().height;

    probe.remove();

    return height;
  }

  private resolveLineHeight(
    rootStyle: CSSStyleDeclaration,
    inputStyle: CSSStyleDeclaration,
  ): number {
    const inputLineHeight = Number.parseFloat(inputStyle.lineHeight);

    if (!Number.isNaN(inputLineHeight)) {
      return inputLineHeight;
    }

    const measured = this.measureLineHeight(inputStyle);

    if (measured > 0) {
      return measured;
    }

    return Number.parseFloat(rootStyle.lineHeight) || 0;
  }

  private lineMetrics(
    rootStyle: CSSStyleDeclaration,
    inputStyle: CSSStyleDeclaration,
  ): LineMetrics {
    if (this.cachedLineMetrics) {
      return this.cachedLineMetrics;
    }

    this.cachedLineMetrics = {
      lineHeight: this.resolveLineHeight(rootStyle, inputStyle),
      paddingVertical:
        (Number.parseFloat(inputStyle.paddingTop) || 0) +
        (Number.parseFloat(inputStyle.paddingBottom) || 0),
    };

    return this.cachedLineMetrics;
  }

  private lineVarPx(
    name: string,
    rootStyle: CSSStyleDeclaration,
    inputStyle: CSSStyleDeclaration,
  ): number | null {
    const lines = Number.parseFloat(rootStyle.getPropertyValue(name));

    if (Number.isNaN(lines) || lines <= 0) {
      return null;
    }

    const metrics = this.lineMetrics(rootStyle, inputStyle);

    return lines * metrics.lineHeight + metrics.paddingVertical;
  }

  private applyMinLines(
    rootStyle: CSSStyleDeclaration,
    inputStyle: CSSStyleDeclaration,
    availableHeight: number,
  ): void {
    const minPx = this.lineVarPx("--hfe-editor-min-lines", rootStyle, inputStyle);

    if (minPx === null) {
      if (this.appliedMinHeight) {
        this.rootEl.style.minHeight = "";
        this.appliedMinHeight = false;
      }

      return;
    }

    const heightCap = Number.isFinite(availableHeight)
      ? Math.max(Math.floor(availableHeight), 0)
      : minPx;
    const value = `max(100%, ${Math.min(minPx, heightCap)}px)`;

    if (this.rootEl.style.minHeight !== value) {
      this.rootEl.style.minHeight = value;
    }

    this.appliedMinHeight = true;
  }

  private syncManualSize(contentHeight: number): void {
    if (!this.rootEl.style.height) {
      return;
    }

    const innerHeight = this.rootEl.clientHeight;

    this.applyStyle(this.overlayEl, "maxHeight", `${innerHeight}px`);
    this.rootEl.classList.toggle(CN.editorHeightCapped, contentHeight > innerHeight);
  }

  private applyHeightCap(
    rootStyle: CSSStyleDeclaration,
    availableHeight: number,
    contentHeight: number,
  ): void {
    const borderHeight =
      (Number.parseFloat(rootStyle.borderTopWidth) || 0) +
      (Number.parseFloat(rootStyle.borderBottomWidth) || 0);
    const innerHeight = Math.max(Math.floor(availableHeight - borderHeight), 0);

    this.applyStyle(this.rootEl, "maxHeight", `${Math.max(Math.floor(availableHeight), 0)}px`);
    this.applyStyle(this.overlayEl, "maxHeight", `${innerHeight}px`);
    this.rootEl.classList.toggle(CN.editorHeightCapped, contentHeight > innerHeight);
  }

  private applyStyle(
    element: HTMLElement,
    property: "maxWidth" | "maxHeight",
    value: string,
  ): void {
    if (element.style[property] !== value) {
      element.style[property] = value;
    }
  }

  private isClipping(overflowValue: string): boolean {
    return overflowValue !== "" && overflowValue !== "visible";
  }

  private findClippingAncestor(): HTMLElement | null {
    if (this.cachedClip === undefined) {
      this.cachedClip = findAncestor(
        this.rootEl.parentElement,
        (style) =>
          this.isClipping(style.overflow) ||
          this.isClipping(style.overflowX) ||
          this.isClipping(style.overflowY),
      );
    }

    return this.cachedClip;
  }

  private resolveClip(): ResolvedClip {
    const clipping = this.findClippingAncestor();

    if (clipping) {
      const clipRect = clipping.getBoundingClientRect();

      return { element: clipping, left: clipRect.left, top: clipRect.top };
    }

    return { element: this.rootEl.ownerDocument.documentElement, left: 0, top: 0 };
  }

  scheduleUpdate(): void {
    this.requestUpdateFrame();
  }

  invalidateCache(): void {
    this.cachedClip = undefined;
    this.cachedLineMetrics = undefined;
  }

  update(): void {
    const rootStyle = getComputedStyle(this.rootEl);
    const inputStyle = getComputedStyle(this.inputEl);
    const maxLinesPx = this.lineVarPx("--hfe-editor-max-lines", rootStyle, inputStyle);
    const clip = this.resolveClip();
    const rootRect = this.rootEl.getBoundingClientRect();
    const availableWidth = this.availableWidth(clip, rootRect, rootStyle);
    const clipHeight = clip.top + clip.element.clientTop + clip.element.clientHeight - rootRect.top;
    const availableHeight = maxLinesPx === null ? clipHeight : Math.min(clipHeight, maxLinesPx);
    const contentHeight = this.mirrorContentHeight();

    this.applyMinLines(rootStyle, inputStyle, availableHeight);

    if (availableWidth > 0) {
      this.applyStyle(this.rootEl, "maxWidth", `${Math.ceil(availableWidth)}px`);
    }

    this.applyHeightCap(rootStyle, availableHeight, contentHeight);
    this.syncManualSize(contentHeight);
    this.overlayEl.scrollTop = this.inputEl.scrollTop;
    this.overlayEl.scrollLeft = this.inputEl.scrollLeft;
  }

  resetManualSize(): void {
    if (this.rootEl.style.height) {
      this.rootEl.style.height = "";
    }

    if (this.rootEl.style.width) {
      this.rootEl.style.width = "";
    }
  }

  refresh(): void {
    this.update();

    if (typeof requestAnimationFrame !== "function") {
      return;
    }

    if (this.deferredFrame) {
      cancelAnimationFrame(this.deferredFrame);
    }

    this.deferredFrame = requestAnimationFrame(() => {
      this.deferredFrame = 0;
      this.update();
    });
  }

  attach(): void {
    this.scope.listen(window, "scroll", this.handleAmbientResize, { capture: true });
    this.scope.listen(window, "resize", this.handleAmbientResize);

    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => {
        this.requestUpdateFrame();
        this.onRootResize?.();
      });
      this.resizeObserver.observe(this.rootEl);
    }

    this.scope.activate();
  }

  detach(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.deferredFrame) {
      cancelAnimationFrame(this.deferredFrame);
      this.deferredFrame = 0;
    }

    if (this.scheduledFrame) {
      cancelAnimationFrame(this.scheduledFrame);
      this.scheduledFrame = 0;
    }

    this.scope.deactivate();
  }
}
