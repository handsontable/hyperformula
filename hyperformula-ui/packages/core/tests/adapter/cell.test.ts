import { describe, expect, it } from "vitest";
import { findDataEdge, formatCellValue, parseCellInput, stepCell } from "../../src/adapter/cell";

describe("parseCellInput", () => {
  it("returns an empty string for blank input", () => {
    expect(parseCellInput("   ")).toBe("");
  });

  it("keeps a formula string verbatim (trimmed)", () => {
    expect(parseCellInput("  =A1+B1  ")).toBe("=A1+B1");
  });

  it("parses an integer into a number", () => {
    expect(parseCellInput("42")).toBe(42);
  });

  it("leaves non-numeric text as a string", () => {
    expect(parseCellInput("hello")).toBe("hello");
  });
});

describe("formatCellValue", () => {
  it("renders null and undefined as an empty string", () => {
    expect(formatCellValue(null)).toBe("");
    expect(formatCellValue(undefined)).toBe("");
  });

  it("renders an integer without decimals", () => {
    expect(formatCellValue(5)).toBe("5");
  });

  it("trims trailing zeros from a fractional number", () => {
    expect(formatCellValue(3.14)).toBe("3.14");
  });

  it("rounds a long fraction to four decimals", () => {
    expect(formatCellValue(1.23456)).toBe("1.2346");
  });

  it("prefers the error value string when present", () => {
    expect(formatCellValue({ type: "DIV_BY_ZERO", value: "#DIV/0!" })).toBe("#DIV/0!");
  });

  it("falls back to #<type> when an error has no value", () => {
    expect(formatCellValue({ type: "NUM" })).toBe("#NUM");
  });

  it("stringifies a plain string", () => {
    expect(formatCellValue("text")).toBe("text");
  });
});

describe("stepCell", () => {
  const size = { rows: 5, cols: 4 };
  const at = (row: number, col: number) => ({ sheet: "", row, col });

  it("moves one cell in each direction", () => {
    expect(stepCell(at(2, 2), "up", size)).toEqual(at(1, 2));
    expect(stepCell(at(2, 2), "down", size)).toEqual(at(3, 2));
    expect(stepCell(at(2, 2), "left", size)).toEqual(at(2, 1));
    expect(stepCell(at(2, 2), "right", size)).toEqual(at(2, 3));
  });

  it("clamps at the grid edges", () => {
    expect(stepCell(at(0, 0), "up", size)).toEqual(at(0, 0));
    expect(stepCell(at(0, 0), "left", size)).toEqual(at(0, 0));
    expect(stepCell(at(4, 3), "down", size)).toEqual(at(4, 3));
    expect(stepCell(at(4, 3), "right", size)).toEqual(at(4, 3));
  });

  it("returns the origin unchanged for an empty grid", () => {
    expect(stepCell(at(2, 2), "down", { rows: 0, cols: 0 })).toEqual(at(2, 2));
  });

  it("preserves the sheet name", () => {
    expect(stepCell({ sheet: "S", row: 1, col: 1 }, "down", size).sheet).toBe("S");
  });
});

describe("findDataEdge", () => {
  const size = { rows: 5, cols: 5 };

  function dataAt(cells: [number, number][]) {
    return (row: number, col: number): boolean =>
      cells.some(([dataRow, dataCol]) => dataRow === row && dataCol === col);
  }

  it("extends to the end of a contiguous data run", () => {
    const hasData = dataAt([
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
    const edge = findDataEdge({ sheet: "", row: 0, col: 0 }, "down", size, hasData);

    expect(edge).toEqual({ sheet: "", row: 3, col: 0 });
  });

  it("steps one cell when the adjacent cell is empty", () => {
    const edge = findDataEdge({ sheet: "", row: 0, col: 0 }, "down", size, () => false);

    expect(edge).toEqual({ sheet: "", row: 1, col: 0 });
  });

  it("clamps the single step at the grid edge", () => {
    const edge = findDataEdge({ sheet: "", row: 4, col: 0 }, "down", size, () => false);

    expect(edge).toEqual({ sheet: "", row: 4, col: 0 });
  });

  it("walks horizontally for left and right", () => {
    const hasData = dataAt([
      [0, 1],
      [0, 2],
    ]);
    const edge = findDataEdge({ sheet: "", row: 0, col: 0 }, "right", size, hasData);

    expect(edge).toEqual({ sheet: "", row: 0, col: 2 });
  });

  it("returns from unchanged for an empty grid", () => {
    const edge = findDataEdge(
      { sheet: "", row: 0, col: 0 },
      "down",
      { rows: 0, cols: 0 },
      () => true,
    );

    expect(edge).toEqual({ sheet: "", row: 0, col: 0 });
  });
});
