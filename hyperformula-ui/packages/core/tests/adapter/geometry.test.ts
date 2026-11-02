import { describe, expect, it } from "vitest";
import { splitRangeByFrozen, unionRectRelativeTo } from "../../src/adapter/geometry";
import type { CellRange } from "../../src/adapter/types";

function domRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function elementWithRect(rect: DOMRect): HTMLElement {
  const element = document.createElement("div");

  element.getBoundingClientRect = () => rect;

  return element;
}

function range(startRow: number, startCol: number, endRow: number, endCol: number): CellRange {
  return {
    start: { sheet: "", row: startRow, col: startCol },
    end: { sheet: "", row: endRow, col: endCol },
  };
}

function tuples(ranges: CellRange[]): [number, number, number, number][] {
  return ranges.map((item) => [item.start.row, item.start.col, item.end.row, item.end.col]);
}

describe("splitRangeByFrozen", () => {
  it("returns the range unchanged when nothing is frozen", () => {
    expect(tuples(splitRangeByFrozen(range(1, 1, 4, 4), 0, 0))).toEqual([[1, 1, 4, 4]]);
  });

  it("returns a single piece when the range sits entirely in the scroll body", () => {
    expect(tuples(splitRangeByFrozen(range(3, 3, 5, 5), 2, 2))).toEqual([[3, 3, 5, 5]]);
  });

  it("returns a single piece when the range sits entirely in the frozen corner", () => {
    expect(tuples(splitRangeByFrozen(range(0, 0, 1, 1), 2, 2))).toEqual([[0, 0, 1, 1]]);
  });

  it("splits into two columns when only the frozen-column boundary is crossed", () => {
    expect(tuples(splitRangeByFrozen(range(3, 0, 4, 5), 2, 2))).toEqual([
      [3, 0, 4, 1],
      [3, 2, 4, 5],
    ]);
  });

  it("splits into two rows when only the frozen-row boundary is crossed", () => {
    expect(tuples(splitRangeByFrozen(range(0, 3, 5, 4), 2, 2))).toEqual([
      [0, 3, 1, 4],
      [2, 3, 5, 4],
    ]);
  });

  it("splits into four quadrants when both boundaries are straddled", () => {
    expect(tuples(splitRangeByFrozen(range(0, 0, 5, 5), 2, 2))).toEqual([
      [0, 0, 1, 1],
      [0, 2, 1, 5],
      [2, 0, 5, 1],
      [2, 2, 5, 5],
    ]);
  });

  it("splits a full-height column into top, middle, and bottom bands", () => {
    expect(tuples(splitRangeByFrozen(range(0, 3, 9, 3), 2, 0, 2, 10))).toEqual([
      [0, 3, 1, 3],
      [2, 3, 7, 3],
      [8, 3, 9, 3],
    ]);
  });

  it("keeps a bottom-only range in a single band", () => {
    expect(tuples(splitRangeByFrozen(range(8, 3, 9, 4), 2, 0, 2, 10))).toEqual([[8, 3, 9, 4]]);
  });

  it("produces six pieces when straddling top, bottom, and the start column", () => {
    expect(tuples(splitRangeByFrozen(range(0, 0, 9, 5), 2, 2, 2, 10))).toEqual([
      [0, 0, 1, 1],
      [0, 2, 1, 5],
      [2, 0, 7, 1],
      [2, 2, 7, 5],
      [8, 0, 9, 1],
      [8, 2, 9, 5],
    ]);
  });

  it("normalizes a reversed range before splitting", () => {
    expect(tuples(splitRangeByFrozen(range(5, 5, 0, 0), 2, 2))).toEqual([
      [0, 0, 1, 1],
      [0, 2, 1, 5],
      [2, 0, 5, 1],
      [2, 2, 5, 5],
    ]);
  });
});

describe("unionRectRelativeTo", () => {
  it("returns null when the start element is missing", () => {
    const host = elementWithRect(domRect(0, 0, 500, 300));
    const endEl = elementWithRect(domRect(10, 10, 40, 20));

    expect(unionRectRelativeTo(host, null, endEl)).toBeNull();
  });

  it("returns null when the end element is missing", () => {
    const host = elementWithRect(domRect(0, 0, 500, 300));
    const startEl = elementWithRect(domRect(10, 10, 40, 20));

    expect(unionRectRelativeTo(host, startEl, null)).toBeNull();
  });

  it("returns the cell's own size and offset when start and end are the same element", () => {
    const host = elementWithRect(domRect(100, 50, 500, 300));
    const cell = elementWithRect(domRect(160, 90, 40, 20));

    expect(unionRectRelativeTo(host, cell, cell)).toEqual({
      left: 60,
      top: 40,
      width: 40,
      height: 20,
    });
  });

  it("unions two cell rects into one bounding box", () => {
    const host = elementWithRect(domRect(0, 0, 500, 300));
    const startEl = elementWithRect(domRect(10, 10, 40, 20));
    const endEl = elementWithRect(domRect(90, 70, 40, 20));

    expect(unionRectRelativeTo(host, startEl, endEl)).toEqual({
      left: 10,
      top: 10,
      width: 120,
      height: 80,
    });
  });

  it("produces the same bounding box when the end cell sits above and left of the start cell", () => {
    const host = elementWithRect(domRect(0, 0, 500, 300));
    const startEl = elementWithRect(domRect(90, 70, 40, 20));
    const endEl = elementWithRect(domRect(10, 10, 40, 20));

    expect(unionRectRelativeTo(host, startEl, endEl)).toEqual({
      left: 10,
      top: 10,
      width: 120,
      height: 80,
    });
  });

  it("adds the host's scroll offsets to the relative position", () => {
    const host = elementWithRect(domRect(100, 50, 500, 300));
    const cell = elementWithRect(domRect(160, 90, 40, 20));

    Object.defineProperty(host, "scrollLeft", { value: 25 });
    Object.defineProperty(host, "scrollTop", { value: 15 });

    expect(unionRectRelativeTo(host, cell, cell)).toEqual({
      left: 85,
      top: 55,
      width: 40,
      height: 20,
    });
  });
});
