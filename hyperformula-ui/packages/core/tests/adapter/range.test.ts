import { describe, expect, it } from "vitest";
import {
  expandHeaderSpan,
  expandWholeRange,
  normalizeRange,
  singleCellSelection,
} from "../../src/adapter/range";
import type { CellAddress, GridSize, HeaderPick } from "../../src/adapter/types";
import type { RangeRefMeta } from "../../src/lexer/types";

function wholeColumnMeta(startCol: number, endCol: number): RangeRefMeta {
  return {
    whole: "column",
    start: { col: startCol, row: 0, abs: { col: false, row: false } },
    end: { col: endCol, row: 0, abs: { col: false, row: false } },
  };
}

function wholeRowMeta(startRow: number, endRow: number): RangeRefMeta {
  return {
    whole: "row",
    start: { col: 0, row: startRow, abs: { col: false, row: false } },
    end: { col: 0, row: endRow, abs: { col: false, row: false } },
  };
}

function cell(col: number, row: number, sheet = "Sheet1"): CellAddress {
  return { sheet, col, row };
}

describe("normalizeRange", () => {
  it("keeps an already top-left to bottom-right range", () => {
    expect(normalizeRange(cell(1, 2), cell(3, 4))).toEqual({
      start: { sheet: "Sheet1", col: 1, row: 2 },
      end: { sheet: "Sheet1", col: 3, row: 4 },
    });
  });

  it("swaps reversed corners to min/max", () => {
    expect(normalizeRange(cell(3, 4), cell(1, 2))).toEqual({
      start: { sheet: "Sheet1", col: 1, row: 2 },
      end: { sheet: "Sheet1", col: 3, row: 4 },
    });
  });

  it("normalizes a mixed-corner selection independently per axis", () => {
    expect(normalizeRange(cell(3, 2), cell(1, 4))).toEqual({
      start: { sheet: "Sheet1", col: 1, row: 2 },
      end: { sheet: "Sheet1", col: 3, row: 4 },
    });
  });

  it("carries the start sheet onto both corners", () => {
    const result = normalizeRange(cell(0, 0, "Data"), cell(1, 1, "Other"));

    expect(result.start.sheet).toBe("Data");
    expect(result.end.sheet).toBe("Data");
  });
});

describe("expandWholeRange", () => {
  it("expands a whole-column range down the full sheet height", () => {
    expect(expandWholeRange(wholeColumnMeta(0, 2), "Sheet1", { width: 10, height: 5 })).toEqual({
      start: { sheet: "Sheet1", col: 0, row: 0 },
      end: { sheet: "Sheet1", col: 2, row: 4 },
    });
  });

  it("expands a whole-row range across the full sheet width", () => {
    expect(expandWholeRange(wholeRowMeta(1, 4), "Sheet1", { width: 8, height: 20 })).toEqual({
      start: { sheet: "Sheet1", col: 0, row: 1 },
      end: { sheet: "Sheet1", col: 7, row: 4 },
    });
  });

  it("returns null for a non-whole range", () => {
    const meta: RangeRefMeta = {
      start: { col: 0, row: 0, abs: { col: false, row: false } },
      end: { col: 1, row: 1, abs: { col: false, row: false } },
    };

    expect(expandWholeRange(meta, "Sheet1", { width: 10, height: 10 })).toBe(null);
  });
});

describe("singleCellSelection", () => {
  it("builds a GridSelection whose range start and end equal the address", () => {
    const address = { sheet: "Sheet1", col: 2, row: 4 };
    const selection = singleCellSelection(address);

    expect(selection.active).toEqual(address);
    expect(selection.range.start).toEqual(address);
    expect(selection.range.end).toEqual(address);
  });
});

describe("expandHeaderSpan", () => {
  it("expands a column span to full grid height", () => {
    const pick: HeaderPick = { axis: "column", sheet: "S", start: 1, end: 2, append: false };
    const size: GridSize = { rows: 10, cols: 5 };

    expect(expandHeaderSpan(pick, size)).toEqual({
      start: { sheet: "S", col: 1, row: 0 },
      end: { sheet: "S", col: 2, row: 9 },
    });
  });

  it("expands a row span to full grid width", () => {
    const pick: HeaderPick = { axis: "row", sheet: "S", start: 1, end: 3, append: false };
    const size: GridSize = { rows: 10, cols: 5 };

    expect(expandHeaderSpan(pick, size)).toEqual({
      start: { sheet: "S", col: 0, row: 1 },
      end: { sheet: "S", col: 4, row: 3 },
    });
  });

  it("normalizes reversed start/end for columns", () => {
    const pick: HeaderPick = { axis: "column", sheet: "S", start: 2, end: 0, append: false };
    const size: GridSize = { rows: 10, cols: 5 };

    expect(expandHeaderSpan(pick, size)).toEqual({
      start: { sheet: "S", col: 0, row: 0 },
      end: { sheet: "S", col: 2, row: 9 },
    });
  });

  it("normalizes reversed start/end for rows", () => {
    const pick: HeaderPick = { axis: "row", sheet: "S", start: 3, end: 1, append: false };
    const size: GridSize = { rows: 10, cols: 5 };

    expect(expandHeaderSpan(pick, size)).toEqual({
      start: { sheet: "S", col: 0, row: 1 },
      end: { sheet: "S", col: 4, row: 3 },
    });
  });
});
