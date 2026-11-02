import { describe, expect, it, vi } from "vitest";
import { stepCell } from "../../src/adapter/cell";
import type { CellAddress, CellRange, Direction } from "../../src/adapter/types";
import { PointModeController } from "../../src/formulaEditor/pointModeController";

function makeHarness(active: CellAddress | null) {
  const inserted: string[] = [];
  const adapter = {
    getActiveCell: () => active,
    getGridSize: () => ({ rows: 100, cols: 100 }),
    getDataEdge: (from: CellAddress, direction: Direction): CellAddress =>
      direction === "right" ? { ...from, col: 99 } : { ...from, col: 0 },
    stepCell: (from: CellAddress, direction: Direction): CellAddress =>
      stepCell(from, direction, { rows: 100, cols: 100 }),
    formatRef: (ref: CellAddress | CellRange) =>
      "start" in ref
        ? `${ref.start.col},${ref.start.row}:${ref.end.col},${ref.end.row}`
        : `${ref.col},${ref.row}`,
    highlightRange: vi.fn(),
    clearEphemeralHighlight: vi.fn(),
    scrollCellIntoView: vi.fn(),
  };
  const refs = { tryInsertRef: (value: string) => inserted.push(value), resetLastRef: vi.fn() };
  const highlights = { afterMutation: vi.fn(), previewColorFor: (value: string) => value };
  const ctx = { adapter } as never;
  const point = new PointModeController(ctx, refs as never, highlights as never);

  return { point, inserted, adapter, refs };
}

describe("PointModeController", () => {
  it("enter() seeds from the active cell", () => {
    const { point } = makeHarness({ sheet: "S", col: 1, row: 1 });

    expect(point.enter()).toBe(true);
    expect(point.isActive()).toBe(true);
  });

  it("enter() returns false when there is no active cell", () => {
    const { point } = makeHarness(null);

    expect(point.enter()).toBe(false);
    expect(point.isActive()).toBe(false);
  });

  it("move() steps the cursor and inserts a single-cell ref", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 1, row: 1 });

    point.enter();
    point.move("right", false);

    expect(inserted.at(-1)).toBe("2,1");
  });

  it("move() clamps at the grid edge", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 99, row: 1 });

    point.enter();
    point.move("right", false);

    expect(inserted.at(-1)).toBe("99,1");
  });

  it("extend keeps the anchor and inserts a range", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 1, row: 1 });

    point.enter();
    point.move("right", true);

    expect(inserted.at(-1)).toBe("1,1:2,1");
  });

  it("normalizes a leftward extend so start is top-left", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 2, row: 2 });

    point.enter();
    point.move("left", true);

    expect(inserted.at(-1)).toBe("1,2:2,2");
  });

  it("jump() goes to the data edge", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 1, row: 1 });

    point.enter();
    point.jump("right", false);

    expect(inserted.at(-1)).toBe("99,1");
  });

  it("toggle() arms point mode without inserting a reference", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 2, row: 2 });

    expect(point.toggle()).toBe(true);
    expect(point.isActive()).toBe(true);
    expect(inserted).toEqual([]);
  });

  it("toggle() again disarms point mode", () => {
    const { point } = makeHarness({ sheet: "S", col: 2, row: 2 });

    point.toggle();

    expect(point.toggle()).toBe(true);
    expect(point.isActive()).toBe(false);
  });

  it("toggle() returns false when there is no active cell", () => {
    const { point } = makeHarness(null);

    expect(point.toggle()).toBe(false);
    expect(point.isActive()).toBe(false);
  });

  it("an arrow after toggle inserts the stepped ref, never the editing cell", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 2, row: 2 });

    point.toggle();
    point.move("right", false);

    expect(inserted).toEqual(["3,2"]);
  });

  it("move() scrolls the stepped cursor cell into view", () => {
    const { point, adapter } = makeHarness({ sheet: "S", col: 1, row: 1 });

    point.enter();
    point.move("down", false);

    expect(adapter.scrollCellIntoView).toHaveBeenLastCalledWith({ sheet: "S", col: 1, row: 2 });
  });

  it("extend move scrolls the moving end into view, not the anchor", () => {
    const { point, adapter } = makeHarness({ sheet: "S", col: 2, row: 2 });

    point.enter();
    point.move("up", true);

    expect(adapter.scrollCellIntoView).toHaveBeenLastCalledWith({ sheet: "S", col: 2, row: 1 });
  });

  it("exit() clears active state and resets the pending ref", () => {
    const { point, refs, adapter } = makeHarness({ sheet: "S", col: 1, row: 1 });

    point.enter();
    point.exit();

    expect(point.isActive()).toBe(false);
    expect(refs.resetLastRef).toHaveBeenCalled();
    expect(adapter.clearEphemeralHighlight).toHaveBeenCalled();
  });

  it("extend jump keeps the anchor and inserts a range to the edge", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 1, row: 1 });

    point.enter();
    point.jump("right", true);

    expect(inserted.at(-1)).toBe("1,1:99,1");
  });

  it("extend jump normalizes when the edge is before the anchor", () => {
    const { point, inserted } = makeHarness({ sheet: "S", col: 5, row: 2 });

    point.enter();
    point.jump("left", true);

    expect(inserted.at(-1)).toBe("0,2:5,2");
  });
});
