import { describe, expect, it, vi } from "vitest";
import { PickEmitter } from "../../src/adapter/pickEmitter";
import type { CellAddress, CellRange, HeaderPick } from "../../src/adapter/types";

const address: CellAddress = { sheet: "Sheet1", col: 1, row: 2 };
const range: CellRange = { start: address, end: { sheet: "Sheet1", col: 3, row: 4 } };

describe("PickEmitter", () => {
  it("forwards a cell pick payload to listeners verbatim", () => {
    const emitter = new PickEmitter();
    const listener = vi.fn();

    emitter.onCellPick(listener);
    emitter.emitCell({ ref: address, append: false });

    expect(listener).toHaveBeenCalledWith({ ref: address, append: false });
  });

  it("drops all listeners on clear", () => {
    const emitter = new PickEmitter();
    const cellListener = vi.fn();
    const rangeListener = vi.fn();

    emitter.onCellPick(cellListener);
    emitter.onRangePick(rangeListener);
    emitter.clear();
    emitter.emitCell({ ref: address, append: false });
    emitter.emitRange({ ref: range, append: false });

    expect(cellListener).not.toHaveBeenCalled();
    expect(rangeListener).not.toHaveBeenCalled();
  });

  it("forwards an outside cell click to listeners", () => {
    const emitter = new PickEmitter();
    const listener = vi.fn();

    emitter.onOutsideCellClick(listener);
    emitter.emitOutsideCellClick(address);

    expect(listener).toHaveBeenCalledWith(address);
  });

  it("delivers header picks to subscribers and stops after unsubscribe", () => {
    const emitter = new PickEmitter();
    const seen: HeaderPick[] = [];
    const unsubscribe = emitter.onHeaderPick((pick) => seen.push(pick));

    emitter.emitHeader({ axis: "column", sheet: "S", start: 1, end: 3, append: false });
    unsubscribe();
    emitter.emitHeader({ axis: "row", sheet: "S", start: 0, end: 0, append: true });

    expect(seen).toEqual([{ axis: "column", sheet: "S", start: 1, end: 3, append: false }]);
  });
});
