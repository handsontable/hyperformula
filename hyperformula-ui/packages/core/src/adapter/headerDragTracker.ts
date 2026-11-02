import type { HeaderAxis, HeaderPick } from "./types";

/**
 * Options for {@link HeaderDragTracker}.
 *
 * @category Grid Adapter
 */
export interface HeaderDragTrackerOptions {
  /** Sheet name stamped onto every produced pick. */
  sheet: string;

  /** Called with the in-progress span on `begin` and each `extendTo` change. */
  onPreview(pick: HeaderPick): void;

  /** Called with the final span when the drag finishes. */
  onDrop(pick: HeaderPick): void;

  /** Called when the drag ends, before `onDrop` on finish and alone on cancel. */
  onDragEnd(): void;
}

/**
 * Tracks a header click/drag gesture into a whole-row/column {@link HeaderPick}: `begin`
 * anchors the span, `extendTo` widens it (previewing each change), and `finish` emits it.
 *
 * @category Grid Adapter
 */
export class HeaderDragTracker {
  private readonly opts: HeaderDragTrackerOptions;
  private state: { axis: HeaderAxis; anchor: number; last: number; append: boolean } | null = null;

  constructor(opts: HeaderDragTrackerOptions) {
    this.opts = opts;
  }

  private pick(): HeaderPick {
    const state = this.state as NonNullable<typeof this.state>;

    return {
      axis: state.axis,
      sheet: this.opts.sheet,
      start: Math.min(state.anchor, state.last),
      end: Math.max(state.anchor, state.last),
      append: state.append,
    };
  }

  /** Whether a header drag is in progress. */
  isActive(): boolean {
    return this.state !== null;
  }

  /** The axis of the in-progress drag, or `null` when inactive. */
  activeAxis(): HeaderAxis | null {
    return this.state?.axis ?? null;
  }

  /** Starts a drag anchored at `index` on `axis` and previews the single-line span. */
  begin(axis: HeaderAxis, index: number, append: boolean): void {
    this.state = { axis, anchor: index, last: index, append };
    this.opts.onPreview(this.pick());
  }

  /** Extends the span to `index`; ignored when inactive, off-axis, or unchanged. */
  extendTo(axis: HeaderAxis, index: number): void {
    if (!this.state || axis !== this.state.axis || index === this.state.last) {
      return;
    }

    this.state.last = index;
    this.opts.onPreview(this.pick());
  }

  /** Ends the drag and emits the final pick via `onDrop`. */
  finish(): void {
    if (!this.state) {
      return;
    }

    const pick = this.pick();

    this.state = null;
    this.opts.onDragEnd();
    this.opts.onDrop(pick);
  }

  /** Abandons the drag without emitting a pick. */
  cancel(): void {
    if (!this.state) {
      return;
    }

    this.state = null;
    this.opts.onDragEnd();
  }
}
