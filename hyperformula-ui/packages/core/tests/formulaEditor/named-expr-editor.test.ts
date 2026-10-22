import { describe, expect, it } from "vitest";
import type { CellRange } from "../../src/adapter/types";
import { createEditorHarness } from "../helpers";

class NamedHF {
  listNamedExpressions(scope?: number) {
    return scope === undefined ? ["SalesRange", "TaxRate"] : [];
  }

  getNamedExpressionFormula(name: string) {
    return name === "SalesRange" ? "=A1:A10" : "=0.23";
  }

  simpleCellRangeFromString(text: string) {
    return text === "A1:A10"
      ? { start: { sheet: 0, col: 0, row: 0 }, end: { sheet: 0, col: 0, row: 9 } }
      : undefined;
  }

  simpleCellAddressFromString() {
    return undefined;
  }

  getSheetName() {
    return "";
  }
}

class CrossSheetHF {
  listNamedExpressions(scope?: number) {
    return scope === undefined ? ["OtherSheetRange"] : [];
  }

  getNamedExpressionFormula() {
    return "=Sheet2!A1:A10";
  }

  simpleCellRangeFromString() {
    return { start: { sheet: 1, col: 0, row: 0 }, end: { sheet: 1, col: 0, row: 9 } };
  }

  simpleCellAddressFromString() {
    return undefined;
  }

  getSheetName(sheetId: number) {
    return sheetId === 1 ? "Sheet2" : "Sheet1";
  }

  getSheetId(sheetName: string) {
    return sheetName === "Sheet2" ? 1 : 0;
  }
}

describe("FormulaEditor named expressions", () => {
  it("highlights the grid range a named expression resolves to", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new NamedHF() as never,
      sheetId: 0,
      initialValue: "=SUM(SalesRange)",
    });

    const ranges = adapter.highlights.map((item) => item.range as CellRange);

    expect(ranges).toContainEqual({
      start: { sheet: "", col: 0, row: 0 },
      end: { sheet: "", col: 0, row: 9 },
    });

    destroy();
  });

  it("does not highlight the grid for a scalar named expression", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new NamedHF() as never,
      sheetId: 0,
      initialValue: "=TaxRate",
    });

    expect(adapter.highlights).toHaveLength(0);

    destroy();
  });

  it("does not highlight the grid for a named expression on another sheet", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new CrossSheetHF() as never,
      sheetId: 0,
      initialValue: "=SUM(OtherSheetRange)",
    });

    expect(adapter.highlights).toHaveLength(0);

    destroy();
  });
});
