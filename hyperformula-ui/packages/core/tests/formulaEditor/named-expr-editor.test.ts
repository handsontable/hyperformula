import { describe, expect, it, vi } from "vitest";
import type { CellRange } from "../../src/adapter/types";
import { createEditorHarness, typeInto } from "../helpers";

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

class MissingSheetHF extends NamedHF {
  override listNamedExpressions(scope?: number) {
    if (scope !== undefined) {
      throw new Error(`There's no sheet with id = ${scope}`);
    }

    return ["TaxRate"];
  }

  getSheetDimensions(sheetId: number): { width: number; height: number } {
    throw new Error(`There's no sheet with id = ${sheetId}`);
  }
}

describe("FormulaEditor named expressions without the configured sheet", () => {
  it("keeps editing and coloring global names when the engine has no sheet with the editor's id", () => {
    const { host, editor, destroy } = createEditorHarness({
      hyperformula: new MissingSheetHF() as never,
      sheetId: 3,
    });

    expect(() => typeInto(host, "=TaxRate+1")).not.toThrow();
    expect(editor.getValue()).toBe("=TaxRate+1");
    expect(host.querySelector(".hfe-ref-mark--named")?.textContent).toBe("TaxRate");

    destroy();
  });

  it("keeps editing a whole-column reference without logging an error", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { host, editor, destroy } = createEditorHarness({
      hyperformula: new MissingSheetHF() as never,
      sheetId: 3,
    });

    typeInto(host, "=SUM(A:A)");

    expect(editor.getValue()).toBe("=SUM(A:A)");
    expect(errors).not.toHaveBeenCalled();

    errors.mockRestore();
    destroy();
  });
});
