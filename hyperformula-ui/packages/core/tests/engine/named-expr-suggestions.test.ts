import { describe, expect, it } from "vitest";
import { EngineBridge } from "../../src/engine/engineBridge";

describe("EngineBridge named expression autocomplete", () => {
  it("filterNamedExpressions returns empty array when no engine", () => {
    const bridge = new EngineBridge();
    expect(bridge.filterNamedExpressions("")).toEqual([]);
  });

  it("filterNamedExpressions filters by prefix (case-insensitive)", () => {
    const mockEngine = {
      listNamedExpressions: (scope?: number) =>
        scope === 0 ? ["SummaryData", "TaxRate"] : ["AnnualBudget"],
      getSheetId: () => 0,
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never, sheetId: 0 });
    expect(bridge.filterNamedExpressions("sum")).toEqual(["SummaryData"]);
    expect(bridge.filterNamedExpressions("")).toContain("SummaryData");
    expect(bridge.filterNamedExpressions("")).toContain("AnnualBudget");
  });

  it("formatNamedRange returns undefined when expression resolves to scalar", () => {
    const mockEngine = {
      listNamedExpressions: () => [],
      getNamedExpressionFormula: () => "=42",
      simpleCellRangeFromString: () => undefined,
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never });
    expect(bridge.formatNamedRange("MyConst")).toBeUndefined();
  });

  it("formatNamedRange omits sheet prefix for same-sheet cell reference", () => {
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? ["TargetCell"] : []),
      getNamedExpressionFormula: () => "=A1",
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => ({ sheet: 0, col: 0, row: 0 }),
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never, sheetId: 0 });
    expect(bridge.formatNamedRange("TargetCell")).toBe("A1");
  });

  it("formatNamedRange omits sheet prefix for same-sheet range reference", () => {
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? ["SalesData"] : []),
      getNamedExpressionFormula: () => "=A1:B5",
      simpleCellRangeFromString: () => ({
        start: { sheet: 0, col: 0, row: 0 },
        end: { sheet: 0, col: 1, row: 4 },
      }),
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never, sheetId: 0 });
    expect(bridge.formatNamedRange("SalesData")).toBe("A1:B5");
  });

  it("formatNamedRange includes sheet prefix for cross-sheet cell reference", () => {
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? ["RemoteCell"] : []),
      getNamedExpressionFormula: () => "=Sheet2!A1",
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => ({ sheet: 1, col: 0, row: 0 }),
      getSheetName: (sheetId: number) => (sheetId === 1 ? "Sheet2" : "Sheet1"),
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never, sheetId: 0 });
    expect(bridge.formatNamedRange("RemoteCell")).toBe("Sheet2!A1");
  });

  it("formatNamedRange quotes a cross-sheet name containing a space", () => {
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? ["RemoteData"] : []),
      getNamedExpressionFormula: () => "='My Data'!A1:B5",
      simpleCellRangeFromString: () => ({
        start: { sheet: 1, col: 0, row: 0 },
        end: { sheet: 1, col: 1, row: 4 },
      }),
      getSheetName: () => "My Data",
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never, sheetId: 0 });

    expect(bridge.formatNamedRange("RemoteData")).toBe("'My Data'!A1:B5");
  });

  it("formatNamedRange quotes a cross-sheet cell reference with an apostrophe in the sheet name", () => {
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? ["BobCell"] : []),
      getNamedExpressionFormula: () => "='Bob''s'!A1",
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => ({ sheet: 1, col: 0, row: 0 }),
      getSheetName: () => "Bob's",
    };
    const bridge = new EngineBridge({ hyperformula: mockEngine as never, sheetId: 0 });

    expect(bridge.formatNamedRange("BobCell")).toBe("'Bob''s'!A1");
  });
});
