import type { EventScope } from "../events/eventManager";
import { CN } from "../theme/classNames";
import { elementAt, eventOrigin, findAncestor, isElement, isShadowRoot, viewOf } from "../ui/dom";
import { HeaderDragTracker } from "./headerDragTracker";
import { PickEmitter } from "./pickEmitter";
import { expandHeaderSpan } from "./range";
import { RangeDragTracker } from "./rangeDragTracker";
import { armTrailingClickSwallow } from "./trailingClickSwallow";
import type {
  CellAddress,
  CellPickListener,
  CellRange,
  GridSize,
  HeaderAxis,
  HeaderPick,
  HeaderPickListener,
  OutsideCellClickListener,
  RangePickListener,
  RefSelectionColorResolver,
  Unsubscribe,
} from "./types";

/**
 * The one-method drawing surface {@link DomRangePicker} paints the in-drag preview range
 * through; `null` clears it. `HighlightLayer` satisfies this contract.
 *
 * @category Grid Adapter
 */
export interface EphemeralHighlightSurface {
  setEphemeral(range: CellRange | null, color?: string): void;
}

/**
 * Options for {@link DomRangePicker}.
 *
 * @category Grid Adapter
 */
export interface DomRangePickerOptions {
  /** Grid container the picker listens on. */
  root: HTMLElement;

  /** CSS selector matching one cell element. */
  cellSelector: string;

  /** Sheet name stamped onto every produced address. */
  sheet: string;

  /** Surface the in-drag preview highlight is drawn on. */
  layer: EphemeralHighlightSurface;

  /** Fallback preview color when no resolver is active. */
  ephemeralColor: string;

  /** Class toggled on `root` while ref-selection mode is active. */
  refModeClass?: string;

  /**
   * Maps a cell element to coordinates.
   *
   * @defaultValue reads the element's `data-col`/`data-row` attributes
   */
  resolveAddress?: (cell: HTMLElement) => { row: number; col: number } | null;

  /** Event scope owning the picker's DOM listeners. */
  scope: EventScope;

  /**
   * Scroll container used for drag-past-edge autoscroll.
   *
   * @defaultValue the nearest scrollable ancestor of `root`
   */
  getScrollElement?: () => HTMLElement | null;

  /** CSS selector matching one header element; enables header whole-ref picking. */
  headerSelector?: string;

  /** Maps a header element to its axis and index. */
  resolveHeader?: (headerEl: HTMLElement) => { axis: HeaderAxis; index: number } | null;

  /** Grid dimensions used to expand header picks to full ranges. */
  getGridSize?: () => GridSize;
}

function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  return findAncestor(element, (style) => {
    const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`;

    return overflow.includes("auto") || overflow.includes("scroll");
  });
}

/**
 * DOM-driven cell/range picker for adapters whose host renders plain elements: turns
 * ctrl/cmd-clicks and ref-mode drags over matching cells into {@link CellPick}/
 * {@link RangePick} events, with preview highlights and edge autoscroll.
 *
 * @category Grid Adapter
 */
export class DomRangePicker {
  private readonly root: HTMLElement;
  private readonly cellSelector: string;
  private readonly sheet: string;
  private readonly layer: EphemeralHighlightSurface;
  private readonly ephemeralColor: string;
  private resolveColor: RefSelectionColorResolver | null = null;
  private readonly refModeClass: string | undefined;
  private readonly resolveAddress:
    | ((cell: HTMLElement) => { row: number; col: number } | null)
    | undefined;
  private readonly headerSelector: string | undefined;
  private readonly resolveHeader:
    | ((headerEl: HTMLElement) => { axis: HeaderAxis; index: number } | null)
    | undefined;
  private readonly getGridSize: (() => GridSize) | undefined;
  private readonly emitter = new PickEmitter();
  private readonly scope: EventScope;
  private readonly getScrollElement: () => HTMLElement | null;
  private readonly tracker: RangeDragTracker;
  private readonly headerTracker: HeaderDragTracker;
  private headerClickSwallowCleanup: (() => void) | null = null;

  private inRefMode = false;
  private isPickEligible: (() => boolean) | null = null;
  private onMouseDown = (event: MouseEvent): void => this.handleDown(event);
  private onMouseMove = (event: MouseEvent): void => this.handleMove(event);
  private onMouseUp = (): void => this.handleUp();
  private onWindowBlur = (): void => this.handleWindowBlur();
  private onScroll = (): void => this.handleScroll();

  /** Attaches its mouse/blur listeners immediately on the given `scope`. */
  constructor(opts: DomRangePickerOptions) {
    this.root = opts.root;
    this.cellSelector = opts.cellSelector;
    this.sheet = opts.sheet;
    this.layer = opts.layer;
    this.ephemeralColor = opts.ephemeralColor;
    this.refModeClass = opts.refModeClass;
    this.resolveAddress = opts.resolveAddress;
    this.headerSelector = opts.headerSelector;
    this.resolveHeader = opts.resolveHeader;
    this.getGridSize = opts.getGridSize;
    this.scope = opts.scope;
    this.getScrollElement = opts.getScrollElement ?? (() => findScrollableAncestor(this.root));
    this.tracker = new RangeDragTracker({
      getScrollElement: () => this.getScrollElement(),
      getCellAddressAt: (x, y) => this.getCellAddressAt(x, y),
      onPreview: (range, append) => this.setEphemeralRange(range, append),
      onDragEnd: () => this.layer.setEphemeral(null),
      onDropCell: (pick) => this.emitter.emitCell(pick),
      onDropRange: (pick) => this.emitter.emitRange(pick),
    });
    this.headerTracker = new HeaderDragTracker({
      sheet: this.sheet,
      onPreview: (pick) => this.previewHeaderDrag(pick),
      onDrop: (pick) => this.emitter.emitHeader(pick),
      onDragEnd: () => this.layer.setEphemeral(null),
    });
    const ownerDocument = this.root.ownerDocument;
    const rootNode = this.root.getRootNode();

    this.scope.listen(this.root, "mousedown", this.onMouseDown);
    this.scope.listen(ownerDocument, "mousemove", this.onMouseMove);
    this.scope.listen(ownerDocument, "mouseup", this.onMouseUp);
    this.scope.listen(viewOf(this.root), "blur", this.onWindowBlur);
    this.scope.listen(ownerDocument, "scroll", this.onScroll, { capture: true });

    if (isShadowRoot(rootNode)) {
      this.scope.listen(rootNode, "scroll", this.onScroll, { capture: true });
    }
    this.scope.add({ dispose: () => this.tracker.cancel() });
    this.scope.add({ dispose: () => this.headerTracker.cancel() });
    this.scope.add({ dispose: () => this.disarmHeaderClickSwallow() });
    this.scope.activate();
  }

  private armHeaderClickSwallow(): void {
    this.disarmHeaderClickSwallow();
    this.headerClickSwallowCleanup = armTrailingClickSwallow(
      this.root.ownerDocument,
      (clickTarget) => Boolean(this.headerSelector && clickTarget.closest(this.headerSelector)),
    );
  }

  private disarmHeaderClickSwallow(): void {
    this.headerClickSwallowCleanup?.();
    this.headerClickSwallowCleanup = null;
  }

  private handleWindowBlur(): void {
    if (this.tracker.isActive() || this.headerTracker.isActive()) {
      this.handleUp();
    }
  }

  private handleDown(event: MouseEvent): void {
    const origin = eventOrigin(event);

    if (isElement(origin) && origin.closest(`.${CN.editor}`)) {
      return;
    }

    const hasModifier = event.metaKey || event.ctrlKey;

    if (!this.inRefMode && !hasModifier) {
      return;
    }

    const address = this.cellFromTarget(eventOrigin(event));

    if (!address) {
      this.handleHeaderDown(event, hasModifier);

      return;
    }

    if (this.inRefMode && this.isPickEligible && !this.isPickEligible()) {
      this.emitter.emitOutsideCellClick(address);

      return;
    }

    event.preventDefault();
    this.tracker.begin(address, hasModifier, { x: event.clientX, y: event.clientY });
  }

  private handleHeaderDown(event: MouseEvent, hasModifier: boolean): void {
    const header = this.headerFromTarget(eventOrigin(event));

    if (!header) {
      return;
    }

    if (!this.inRefMode || (this.isPickEligible && !this.isPickEligible())) {
      return;
    }

    event.preventDefault();
    this.headerTracker.begin(header.axis, header.index, hasModifier);
    this.armHeaderClickSwallow();
  }

  private headerFromTarget(target: EventTarget | null): { axis: HeaderAxis; index: number } | null {
    if (!this.headerSelector || !this.resolveHeader) {
      return null;
    }

    if (!isElement(target)) {
      return null;
    }

    const headerEl = target.closest(this.headerSelector) as HTMLElement | null;

    if (!headerEl) {
      return null;
    }

    return this.resolveHeader(headerEl);
  }

  private previewHeaderDrag(pick: HeaderPick): void {
    if (!this.getGridSize) {
      return;
    }

    const expanded = expandHeaderSpan(pick, this.getGridSize());

    this.layer.setEphemeral(
      expanded,
      this.resolveColor?.(expanded, pick.append, pick.axis) ?? this.ephemeralColor,
    );
  }

  private setEphemeralRange(range: CellRange, append: boolean): void {
    this.layer.setEphemeral(range, this.resolveColor?.(range, append) ?? this.ephemeralColor);
  }

  private handleMove(event: MouseEvent): void {
    if (this.headerTracker.isActive()) {
      this.handleHeaderMove(event);

      return;
    }

    if (!this.tracker.isActive()) {
      return;
    }

    if (event.buttons === 0) {
      this.handleUp();

      return;
    }

    this.tracker.updateAutoScroll(event.clientX, event.clientY);

    const address = this.cellFromTarget(eventOrigin(event));

    if (!address) {
      return;
    }

    this.tracker.extendTo(address);
  }

  private handleHeaderMove(event: MouseEvent): void {
    if (event.buttons === 0) {
      this.handleUp();

      return;
    }

    const header = this.headerFromTarget(eventOrigin(event));

    if (header) {
      this.headerTracker.extendTo(header.axis, header.index);

      return;
    }

    const axis = this.headerTracker.activeAxis();
    const address = this.cellFromTarget(eventOrigin(event));

    if (!axis || !address) {
      return;
    }

    this.headerTracker.extendTo(axis, axis === "column" ? address.col : address.row);
  }

  private handleScroll(): void {
    if (this.tracker.isActive()) {
      this.tracker.reextendFromLastPointer();
    }
  }

  private handleUp(): void {
    if (this.headerTracker.isActive()) {
      this.headerTracker.finish();

      return;
    }

    this.tracker.finish();
  }

  /** Subscribes to single-cell picks. */
  onCellPick(callback: CellPickListener): Unsubscribe {
    return this.emitter.onCellPick(callback);
  }

  /** Subscribes to range picks. */
  onRangePick(callback: RangePickListener): Unsubscribe {
    return this.emitter.onRangePick(callback);
  }

  /** Subscribes to ref-mode clicks that were not pick-eligible. */
  onOutsideCellClick(callback: OutsideCellClickListener): Unsubscribe {
    return this.emitter.onOutsideCellClick(callback);
  }

  /** Subscribes to whole-row/column header picks. */
  onHeaderPick(callback: HeaderPickListener): Unsubscribe {
    return this.emitter.onHeaderPick(callback);
  }

  /** Resolves an event target to the address of the cell element containing it, if any. */
  cellFromTarget(target: EventTarget | null): CellAddress | null {
    if (!isElement(target)) {
      return null;
    }

    const cellEl = target.closest(this.cellSelector) as HTMLElement | null;

    if (!cellEl) {
      return null;
    }

    if (this.resolveAddress) {
      const coords = this.resolveAddress(cellEl);

      return coords ? { sheet: this.sheet, col: coords.col, row: coords.row } : null;
    }

    const col = Number.parseInt(cellEl.dataset.col ?? "", 10);
    const row = Number.parseInt(cellEl.dataset.row ?? "", 10);

    if (Number.isNaN(col) || Number.isNaN(row)) {
      return null;
    }

    return { sheet: this.sheet, col, row };
  }

  /** Returns the cell under viewport coordinates, or `null` when none is there. */
  getCellAddressAt(x: number, y: number): CellAddress | null {
    return this.cellFromTarget(elementAt(this.root, x, y));
  }

  /** Whether ref-selection mode is currently active. */
  isRefSelectionActive(): boolean {
    return this.inRefMode;
  }

  /** Enters ref-selection mode; see {@link GridPickSurface.enterRefSelectionMode}. */
  enterRefSelectionMode(
    resolveColor?: RefSelectionColorResolver,
    isPickEligible?: () => boolean,
  ): void {
    this.inRefMode = true;
    this.resolveColor = resolveColor ?? null;
    this.isPickEligible = isPickEligible ?? null;

    if (this.refModeClass) {
      this.root.classList.add(this.refModeClass);
    }
  }

  /** Leaves ref-selection mode, cancelling any in-flight drag and clearing the preview. */
  exitRefSelectionMode(): void {
    this.inRefMode = false;
    this.resolveColor = null;
    this.isPickEligible = null;
    this.headerTracker.cancel();
    this.tracker.cancel();
    this.disarmHeaderClickSwallow();

    if (this.refModeClass) {
      this.root.classList.remove(this.refModeClass);
    }

    this.layer.setEphemeral(null);
  }

  /** Disposes the picker's listeners and drops every subscription. */
  destroy(): void {
    this.scope.dispose();
    this.emitter.clear();
  }
}
