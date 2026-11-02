import { normalizeRange } from "../adapter/range";
import type { CellAddress, CellRange, Direction } from "../adapter/types";
import type { HighlightController } from "./highlightController";
import type { RefController } from "./refController";
import type { EditorContext } from "./types";

interface PointState {
  anchor: CellAddress;
  cursor: CellAddress;
}

export class PointModeController {
  private state: PointState | null = null;

  constructor(
    private readonly ctx: EditorContext,
    private readonly refs: RefController,
    private readonly highlights: HighlightController,
  ) {}

  private insert(extend: boolean): void {
    const state = this.state;

    if (!state) {
      return;
    }

    if (!extend) {
      state.anchor = state.cursor;
    }

    const target: CellAddress | CellRange = extend
      ? normalizeRange(state.anchor, state.cursor)
      : state.cursor;

    const refStr = this.ctx.adapter.formatRef(target);

    this.refs.tryInsertRef(refStr, true);
    this.ctx.adapter.highlightRange(
      "start" in target ? target : { start: target, end: target },
      this.highlights.previewColorFor(refStr),
    );
    this.highlights.afterMutation();
  }

  isActive(): boolean {
    return this.state !== null;
  }

  enter(): boolean {
    const active = this.ctx.adapter.getActiveCell();

    if (!active) {
      return false;
    }

    this.state = { anchor: active, cursor: active };
    this.insert(false);

    return true;
  }

  toggle(): boolean {
    if (this.state) {
      this.exit();

      return true;
    }

    const active = this.ctx.adapter.getActiveCell();

    if (!active) {
      return false;
    }

    this.state = { anchor: active, cursor: active };

    return true;
  }

  move(direction: Direction, extend: boolean): boolean {
    if (!this.state && !this.enter()) {
      return false;
    }

    const state = this.state;

    if (!state) {
      return false;
    }

    state.cursor = this.ctx.adapter.stepCell(state.cursor, direction);
    this.insert(extend);
    this.ctx.adapter.scrollCellIntoView(state.cursor);

    return true;
  }

  jump(direction: Direction, extend: boolean): boolean {
    if (!this.state && !this.enter()) {
      return false;
    }

    const state = this.state;

    if (!state) {
      return false;
    }

    state.cursor = this.ctx.adapter.getDataEdge(state.cursor, direction);
    this.insert(extend);
    this.ctx.adapter.scrollCellIntoView(state.cursor);

    return true;
  }

  deactivate(): void {
    this.state = null;
  }

  exit(): void {
    this.refs.resetLastRef();
    this.ctx.adapter.clearEphemeralHighlight();
    this.state = null;
  }

  cancel(): void {
    this.refs.clearPendingRef();
    this.ctx.adapter.clearEphemeralHighlight();
    this.state = null;
  }
}
