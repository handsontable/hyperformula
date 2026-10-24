import { describe, expect, it } from "vitest";
import { readCellText } from "../../src/engine/readCellText";

const ADDR = { sheet: 0, row: 1, col: 2 };

describe("readCellText", () => {
  it("prefers a non-empty formula", () => {
    const engine = {
      getCellFormula: () => "=SUM(A1:A2)",
      getCellSerialized: () => 42,
      getCellValue: () => 42,
    };

    expect(readCellText(engine, ADDR)).toBe("=SUM(A1:A2)");
  });

  it("falls back to the serialized value when there is no formula", () => {
    const engine = {
      getCellFormula: () => undefined,
      getCellSerialized: () => 42,
      getCellValue: () => 43,
    };

    expect(readCellText(engine, ADDR)).toBe("42");
  });

  it("skips an empty-string formula", () => {
    const engine = {
      getCellFormula: () => "",
      getCellSerialized: () => "text",
    };

    expect(readCellText(engine, ADDR)).toBe("text");
  });

  it("falls back to the cell value when serialized is null", () => {
    const engine = {
      getCellSerialized: () => null,
      getCellValue: () => 7,
    };

    expect(readCellText(engine, ADDR)).toBe("7");
  });

  it("returns an empty string when every tier is empty", () => {
    const engine = {
      getCellFormula: () => undefined,
      getCellSerialized: () => null,
      getCellValue: () => null,
    };

    expect(readCellText(engine, ADDR)).toBe("");
  });

  it("handles an engine with no readers at all", () => {
    expect(readCellText({}, ADDR)).toBe("");
  });
});
