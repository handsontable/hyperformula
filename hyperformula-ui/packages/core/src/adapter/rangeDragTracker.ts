import { EdgeAutoScroller } from "./edgeAutoScroller";
import { normalizeRange } from "./range";
import type { CellAddress, CellPick, CellRange, RangePick } from "./types";

/**
 * Options for {@link RangeDragTracker}.
 *
 * @category Grid Adapter
 */
export interface RangeDragTrackerOptions {
  /** Scroll container used for drag-past-edge autoscroll. */
  getScrollElement(): HTMLElement | null;

  /** Returns the cell under viewport coordinates, or `null` when none is there. */
  getCellAddressAt(x: number, y: number): CellAddress | null;

  /** Fires on every preview update while the drag extends. */
  onPreview(range: CellRange, append: boolean): void;

  /** Fires when the drag ends (finished or cancelled), before any drop callback. */
  onDragEnd(): void;

  /** Fires when a finished drag covered a single cell. */
  onDropCell(pick: CellPick): void;

  /** Fires when a finished drag covered more than one cell. */
  onDropRange(pick: RangePick): void;
}

/**
 * Shared, input-source-agnostic drag-pick state machine: {@link DomRangePicker} feeds it DOM
 * mouse events, host adapters feed it host hooks. Tracks anchor→last extent, drives preview
 * highlights and edge autoscroll, and emits a cell or range pick on finish.
 *
 * @category Grid Adapter
 */
export class RangeDragTracker {
  private readonly opts: RangeDragTrackerOptions;
  private readonly autoScroller: EdgeAutoScroller;
  private anchor: CellAddress | null = null;
  private last: CellAddress | null = null;
  private append = false;
  private lastPointer: { x: number; y: number } | null = null;

  constructor(opts: RangeDragTrackerOptions) {
    this.opts = opts;
    this.autoScroller = new EdgeAutoScroller({
      getScrollElement: () => this.opts.getScrollElement(),
      onStep: (clampedX, clampedY) => this.extendToPoint(clampedX, clampedY),
    });
  }

  private extendToPoint(x: number, y: number): void {
    const address = this.opts.getCellAddressAt(x, y);

    if (!address) {
      return;
    }

    this.extendTo(address);
  }

  private reset(): void {
    this.anchor = null;
    this.last = null;
    this.append = false;
    this.lastPointer = null;
  }

  /** Whether a drag is in flight. */
  isActive(): boolean {
    return this.anchor !== null;
  }

  /**
   * Starts a drag anchored at `anchor`; `append` follows the {@link CellPick} contract.
   * `pointer` seeds the viewport coordinates {@link reextendFromLastPointer} replays on scroll.
   */
  begin(anchor: CellAddress, append: boolean, pointer?: { x: number; y: number }): void {
    this.anchor = anchor;
    this.last = anchor;
    this.append = append;
    this.lastPointer = pointer ?? null;
    this.opts.onPreview(normalizeRange(anchor, anchor), append);
  }

  /** Extends the drag to `address`; no-op when inactive or the extent is unchanged. */
  extendTo(address: CellAddress): void {
    if (!this.anchor) {
      return;
    }

    if (this.last && this.last.row === address.row && this.last.col === address.col) {
      return;
    }

    this.last = address;
    this.opts.onPreview(normalizeRange(this.anchor, address), this.append);
  }

  /** Feeds the current pointer position to the edge autoscroller while a drag is active. */
  updateAutoScroll(x: number, y: number): void {
    if (!this.anchor) {
      return;
    }

    this.lastPointer = { x, y };
    this.autoScroller.update(x, y);
  }

  /**
   * Re-queries the cell under the last known pointer position and extends the drag to it;
   * no-op when inactive or the pointer position is unknown. Covers a scroll under a
   * stationary pointer, which never fires mousemove or the edge autoscroller on its own.
   */
  reextendFromLastPointer(): void {
    if (!this.anchor || !this.lastPointer) {
      return;
    }

    this.extendToPoint(this.lastPointer.x, this.lastPointer.y);
  }

  /** Ends the drag and emits `onDropCell` or `onDropRange` depending on the final extent. */
  finish(): void {
    this.autoScroller.stop();

    if (!this.anchor) {
      return;
    }

    const start = this.anchor;
    const end = this.last ?? start;
    const append = this.append;

    this.reset();
    this.opts.onDragEnd();

    if (start.col === end.col && start.row === end.row) {
      this.opts.onDropCell({ ref: start, append });
    } else {
      this.opts.onDropRange({ ref: normalizeRange(start, end), append });
    }
  }

  /** Aborts the drag without emitting a pick. */
  cancel(): void {
    this.autoScroller.stop();

    if (!this.anchor) {
      return;
    }

    this.reset();
    this.opts.onDragEnd();
  }
}
