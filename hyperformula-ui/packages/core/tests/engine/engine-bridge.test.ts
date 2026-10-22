import { describe, expect, it, vi } from "vitest";
import { EngineBridge } from "../../src/engine/engineBridge";
import type { HyperFormulaLike } from "../../src/engine/types";
import type { RangeRefMeta } from "../../src/lexer/types";

describe("EngineBridge", () => {
  it("returns empty function list without HF", () => {
    const bridge = new EngineBridge();

    expect(bridge.getFunctionNames()).toEqual([]);
  });

  it("filterFunctions ranks prefix matches first", () => {
    class RankHF {
      getRegisteredFunctionNames(): string[] {
        return ["SUBSTITUTE", "SUM", "SUMIF", "ABS"];
      }
      getConfig() {
        return { language: "lang-rank" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new RankHF() as never });
    const ranked = bridge.filterFunctions("SU");

    expect(ranked[0]).toBe("SUBSTITUTE");
    expect(ranked).toContain("SUM");
  });

  it("returns default separators without HF", () => {
    const bridge = new EngineBridge();

    expect(bridge.getSeparators()).toEqual({
      decimalSeparator: ".",
      argSeparator: ",",
      arrayColumnSeparator: ",",
      arrayRowSeparator: ";",
    });
  });

  it("reads separators from the HyperFormula config", () => {
    class LocaleHF {
      getConfig() {
        return {
          language: "plPL",
          decimalSeparator: ",",
          functionArgSeparator: ";",
          arrayColumnSeparator: ",",
          arrayRowSeparator: "|",
        };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new LocaleHF() as never });

    expect(bridge.getSeparators()).toEqual({
      decimalSeparator: ",",
      argSeparator: ";",
      arrayColumnSeparator: ",",
      arrayRowSeparator: "|",
    });
  });
});

describe("EngineBridge catalog cache isolation", () => {
  it("does not leak an engine-less empty catalog into a later bridge with the same language", () => {
    class SharedLangHF {
      getRegisteredFunctionNames(): string[] {
        return ["SUM", "ABS"];
      }
      getConfig() {
        return { language: "shared-lang" };
      }
    }
    const engineless = new EngineBridge({ language: "shared-lang" });

    expect(engineless.getFunctionNames()).toEqual([]);

    const bridge = new EngineBridge({ hyperformula: new SharedLangHF() as never });

    expect(bridge.getFunctionNames()).toEqual(["ABS", "SUM"]);
  });
});

describe("EngineBridge catalog entry validation", () => {
  it("skips getAvailableFunctions entries without a localizedName", () => {
    class MalformedHF {
      getAvailableFunctions() {
        return [
          { localizedName: "SUM", canonicalName: "SUM", category: "", shortDescription: "" },
          { canonicalName: "BROKEN", shortDescription: "" },
        ];
      }
      getConfig() {
        return { language: "malformed-catalog" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new MalformedHF() as never });

    expect(bridge.getFunctionNames()).toEqual(["SUM"]);
  });
});

describe("EngineBridge function catalog", () => {
  it("builds the catalog from getAvailableFunctions, name-sorted with descriptions", () => {
    class CatalogHF {
      getAvailableFunctions() {
        return [
          {
            localizedName: "SUM",
            canonicalName: "SUM",
            category: "Math and trigonometry",
            shortDescription: "Adds numbers",
          },
          {
            localizedName: "ABS",
            canonicalName: "ABS",
            category: "Math and trigonometry",
            shortDescription: "Absolute value",
          },
        ];
      }
      getConfig() {
        return { language: "avail-catalog" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new CatalogHF() as never });

    expect(bridge.getFunctionCatalog()).toEqual([
      {
        name: "ABS",
        canonicalName: "ABS",
        category: "Math and trigonometry",
        shortDescription: "Absolute value",
      },
      {
        name: "SUM",
        canonicalName: "SUM",
        category: "Math and trigonometry",
        shortDescription: "Adds numbers",
      },
    ]);
    expect(bridge.getFunctionNames()).toEqual(["ABS", "SUM"]);
  });

  it("filterFunctionEntries ranks prefix matches first and carries descriptions", () => {
    class CatalogRankHF {
      getAvailableFunctions() {
        return [
          {
            localizedName: "SUM",
            canonicalName: "SUM",
            category: "Math",
            shortDescription: "Adds",
          },
          {
            localizedName: "SUBSTITUTE",
            canonicalName: "SUBSTITUTE",
            category: "Text",
            shortDescription: "Replaces",
          },
          {
            localizedName: "ABS",
            canonicalName: "ABS",
            category: "Math",
            shortDescription: "Absolute",
          },
        ];
      }
      getConfig() {
        return { language: "avail-filter" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new CatalogRankHF() as never });
    const ranked = bridge.filterFunctionEntries("SU");

    expect(ranked.map((entry) => entry.name)).toEqual(["SUBSTITUTE", "SUM"]);
    expect(ranked[0]?.shortDescription).toBe("Replaces");
  });

  it("falls back to getRegisteredFunctionNames when getAvailableFunctions is absent", () => {
    class NamesOnlyHF {
      getRegisteredFunctionNames(): string[] {
        return ["FOO", "BAR"];
      }
      getConfig() {
        return { language: "avail-fallback" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new NamesOnlyHF() as never });

    expect(bridge.getFunctionCatalog()).toEqual([
      { name: "BAR", canonicalName: "BAR", category: "", shortDescription: "" },
      { name: "FOO", canonicalName: "FOO", category: "", shortDescription: "" },
    ]);
  });
});

describe("EngineBridge canonical-name resolution", () => {
  it("resolves the canonical id for getFunctionDetails when the typed name is translated", () => {
    class I18nDetailsHF {
      getAvailableFunctions() {
        return [
          {
            localizedName: "SUMA.SI",
            canonicalName: "SUMIF",
            category: "Math and trigonometry",
            shortDescription: "Suma condicional",
          },
        ];
      }
      getFunctionDetails(canonicalName: string) {
        if (canonicalName !== "SUMIF") {
          return undefined;
        }

        return {
          localizedName: "SUMA.SI",
          canonicalName: "SUMIF",
          category: "Math and trigonometry",
          shortDescription: "Suma condicional",
          parameters: [{ name: "rango", description: "", optional: false }],
          documentationUrl: "",
          examples: [],
          repeatLastArgs: 0,
        };
      }
      getConfig() {
        return { language: "i18n-details" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new I18nDetailsHF() as never });

    expect(bridge.getFunctionSignature("SUMA.SI")).toEqual({
      name: "SUMA.SI",
      description: "Suma condicional",
      repeatLast: 0,
      params: [{ label: "rango", optional: false }],
    });
  });

  it("resolves the canonical id for the getFunctionPlugin fallback", () => {
    class I18nPluginHF {
      getAvailableFunctions() {
        return [
          {
            localizedName: "MOYENNE",
            canonicalName: "AVERAGE",
            category: "Statistical",
            shortDescription: "",
          },
        ];
      }
      getFunctionPlugin(functionId: string) {
        if (functionId !== "AVERAGE") {
          return undefined;
        }

        return {
          implementedFunctions: {
            AVERAGE: {
              parameters: [{ argumentType: "NUMBER", optionalArg: false }],
              repeatLastArgs: 1,
            },
          },
        };
      }
      getConfig() {
        return { language: "i18n-plugin" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new I18nPluginHF() as never });

    expect(bridge.getFunctionSignature("MOYENNE")).toEqual({
      name: "MOYENNE",
      params: [{ label: "number", optional: false }],
      repeatLast: 1,
    });
  });
});

describe("EngineBridge function metadata", () => {
  it("getFunctionSignature omits HF MVP-empty description, docUrl, and param description", () => {
    class SparseHF {
      getRegisteredFunctionNames(): string[] {
        return ["SUM"];
      }
      getFunctionDetails(canonicalName: string) {
        return {
          localizedName: canonicalName,
          canonicalName,
          category: "Math and trigonometry",
          shortDescription: "Adds numbers",
          parameters: [{ name: "value", description: "", optional: false }],
          documentationUrl: "",
          examples: [],
          repeatLastArgs: 0,
        };
      }
      getConfig() {
        return { language: "meta-sparse" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new SparseHF() as never });

    expect(bridge.getFunctionSignature("SUM")).toEqual({
      name: "SUM",
      description: "Adds numbers",
      repeatLast: 0,
      params: [{ label: "value", optional: false }],
    });
  });

  it("getFunctionSignature maps full HF details", () => {
    class DetailsHF {
      getRegisteredFunctionNames(): string[] {
        return ["MYFUNC"];
      }
      getFunctionDetails(canonicalName: string) {
        if (canonicalName !== "MYFUNC") {
          return undefined;
        }

        return {
          localizedName: "MYFUNC",
          canonicalName: "MYFUNC",
          category: "Text",
          shortDescription: "Does a thing",
          parameters: [
            { name: "first", description: "the first arg", optional: false },
            { name: "rest", description: "", optional: true },
          ],
          documentationUrl: "https://example.test/myfunc",
          examples: ["MYFUNC(1, 2)"],
          repeatLastArgs: 1,
        };
      }
      getConfig() {
        return { language: "meta-details" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new DetailsHF() as never });

    expect(bridge.getFunctionSignature("MYFUNC")).toEqual({
      name: "MYFUNC",
      description: "Does a thing",
      docUrl: "https://example.test/myfunc",
      example: "MYFUNC(1, 2)",
      repeatLast: 1,
      params: [
        { label: "first", optional: false, description: "the first arg" },
        { label: "rest", optional: true },
      ],
    });
  });

  it("getFunctionSignature falls back to getFunctionPlugin when HF details are absent", () => {
    class PluginHF {
      getRegisteredFunctionNames(): string[] {
        return ["CUSTOM"];
      }
      getFunctionPlugin(functionId: string) {
        if (functionId !== "CUSTOM") {
          return undefined;
        }

        return {
          implementedFunctions: {
            CUSTOM: {
              parameters: [{ argumentType: "NUMBER", optionalArg: false }],
              repeatLastArgs: 0,
            },
          },
        };
      }
      getConfig() {
        return { language: "meta-plugin" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new PluginHF() as never });

    expect(bridge.getFunctionSignature("CUSTOM")).toEqual({
      name: "CUSTOM",
      params: [{ label: "number", optional: false }],
      repeatLast: 0,
    });
  });

  it("swallows a throwing getRegisteredFunctionNames and returns an empty list", () => {
    class ThrowNamesHF {
      getRegisteredFunctionNames(): never {
        throw new Error("boom");
      }
      getConfig() {
        return { language: "throw-names-lang" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new ThrowNamesHF() as never });

    expect(bridge.getFunctionNames()).toEqual([]);
  });

  it("swallows a throwing getFunctionPlugin and returns null", () => {
    class ThrowPluginHF {
      getRegisteredFunctionNames(): string[] {
        return ["CUSTOM"];
      }
      getFunctionPlugin(): never {
        throw new Error("boom");
      }
      getConfig() {
        return { language: "meta-throw-plugin" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new ThrowPluginHF() as never });

    expect(bridge.getFunctionSignature("CUSTOM")).toBeNull();
  });
});

describe("EngineBridge instance function catalog", () => {
  it("builds the catalog from the instance getAvailableFunctions", () => {
    class InstanceCatalogHF {
      getAvailableFunctions() {
        return [
          {
            localizedName: "SUM",
            canonicalName: "SUM",
            category: "Math and trigonometry",
            shortDescription: "Adds numbers.",
          },
        ];
      }
      getConfig() {
        return { language: "instance-catalog" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new InstanceCatalogHF() as never });

    expect(bridge.getFunctionCatalog()).toEqual([
      {
        name: "SUM",
        canonicalName: "SUM",
        category: "Math and trigonometry",
        shortDescription: "Adds numbers.",
      },
    ]);
  });

  it("ignores a static getAvailableFunctions left on the constructor", () => {
    class MixedCatalogHF {
      static getAvailableFunctions() {
        return [{ localizedName: "STATIC", canonicalName: "STATIC", shortDescription: "" }];
      }

      getAvailableFunctions() {
        return [{ localizedName: "INSTANCE", canonicalName: "INSTANCE", shortDescription: "" }];
      }

      getConfig() {
        return { language: "mixed-catalog" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new MixedCatalogHF() as never });

    expect(bridge.getFunctionNames()).toEqual(["INSTANCE"]);
  });

  it("swallows a throwing instance getAvailableFunctions and falls back to registered names", () => {
    class ThrowingInstanceCatalogHF {
      getRegisteredFunctionNames(): string[] {
        return ["ABS"];
      }
      getAvailableFunctions(): never {
        throw new Error("boom");
      }
      getConfig() {
        return { language: "throwing-instance-catalog" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new ThrowingInstanceCatalogHF() as never });

    expect(bridge.getFunctionNames()).toEqual(["ABS"]);
  });

  it("reads function details from the instance getFunctionDetails", () => {
    class InstanceDetailsHF {
      getAvailableFunctions() {
        return [
          {
            localizedName: "SUMA.SI",
            canonicalName: "SUMIF",
            shortDescription: "Suma condicional",
          },
        ];
      }
      getFunctionDetails(canonicalName: string) {
        if (canonicalName !== "SUMIF") {
          return undefined;
        }

        return {
          localizedName: "SUMA.SI",
          canonicalName: "SUMIF",
          category: "Math and trigonometry",
          shortDescription: "Suma condicional",
          parameters: [{ name: "Rango", description: "Range to test.", optional: false }],
          documentationUrl: "https://example.test/sumif",
          examples: ['=SUMA.SI(A1:A5,">1")'],
          repeatLastArgs: 0,
        };
      }
      getConfig() {
        return { language: "instance-details" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new InstanceDetailsHF() as never });

    expect(bridge.getFunctionSignature("SUMA.SI")).toEqual({
      name: "SUMA.SI",
      params: [{ label: "Rango", optional: false, description: "Range to test." }],
      repeatLast: 0,
      description: "Suma condicional",
      example: '=SUMA.SI(A1:A5,">1")',
      docUrl: "https://example.test/sumif",
    });
  });

  it("swallows a throwing instance getFunctionDetails and falls back to the plugin path", () => {
    class ThrowingInstanceDetailsHF {
      getFunctionPlugin(functionId: string) {
        return {
          implementedFunctions: {
            [functionId]: {
              parameters: [{ argumentType: "NUMBER" }],
              repeatLastArgs: 1,
            },
          },
        };
      }
      getAvailableFunctions() {
        return [{ localizedName: "SUM", canonicalName: "SUM", shortDescription: "" }];
      }
      getFunctionDetails(): never {
        throw new Error("boom");
      }
      getConfig() {
        return { language: "throwing-instance-details" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new ThrowingInstanceDetailsHF() as never });

    expect(bridge.getFunctionSignature("SUM")).toEqual({
      name: "SUM",
      params: [{ label: "number", optional: false }],
      repeatLast: 1,
    });
  });

  it("builds the names-only catalog from the instance getRegisteredFunctionNames", () => {
    class InstanceNamesHF {
      getRegisteredFunctionNames(): string[] {
        return ["FOO", "BAR"];
      }
      getConfig() {
        return { language: "instance-names" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new InstanceNamesHF() as never });

    expect(bridge.getFunctionNames()).toEqual(["BAR", "FOO"]);
  });

  it("reads the plugin signature fallback from the instance getFunctionPlugin", () => {
    class InstancePluginHF {
      getAvailableFunctions() {
        return [{ localizedName: "SUM", canonicalName: "SUM", shortDescription: "" }];
      }
      getFunctionPlugin(functionId: string) {
        return {
          implementedFunctions: {
            [functionId]: {
              parameters: [{ argumentType: "NUMBER" }],
              repeatLastArgs: 1,
            },
          },
        };
      }
      getConfig() {
        return { language: "instance-plugin" };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new InstancePluginHF() as never });

    expect(bridge.getFunctionSignature("SUM")).toEqual({
      name: "SUM",
      params: [{ label: "number", optional: false }],
      repeatLast: 1,
    });
  });
});

describe("resolveNamedExpression", () => {
  class NamedHF {
    listNamedExpressions(scope?: number): string[] {
      if (scope === 0) {
        return ["LocalCell"];
      }

      return ["TaxRate", "Region", "FirstCell", "SalesRange", "LocalCell"];
    }

    getNamedExpressionFormula(name: string, scope?: number): string | undefined {
      if (name === "LocalCell") {
        return scope === 0 ? "=C3" : undefined;
      }

      const formulas: Record<string, string> = {
        TaxRate: "=0.23",
        Region: '="North"',
        FirstCell: "=B2",
        SalesRange: "=A1:A10",
      };

      return formulas[name];
    }

    simpleCellRangeFromString(text: string) {
      if (text === "A1:A10") {
        return { start: { sheet: 0, col: 0, row: 0 }, end: { sheet: 0, col: 0, row: 9 } };
      }

      return undefined;
    }

    simpleCellAddressFromString(text: string) {
      const cells: Record<string, { sheet: number; col: number; row: number }> = {
        B2: { sheet: 0, col: 1, row: 1 },
        C3: { sheet: 0, col: 2, row: 2 },
      };

      return cells[text];
    }

    getSheetName(): string {
      return "Sheet1";
    }
  }

  const bridge = new EngineBridge({ hyperformula: new NamedHF() as never, sheetId: 0 });

  it("returns null for an unknown name", () => {
    expect(bridge.resolveNamedExpression("Nope")).toBeNull();
  });

  it("resolves a scalar named expression", () => {
    expect(bridge.resolveNamedExpression("TaxRate")).toEqual({ kind: "scalar" });
    expect(bridge.resolveNamedExpression("Region")).toEqual({ kind: "scalar" });
  });

  it("resolves a single-cell named expression", () => {
    expect(bridge.resolveNamedExpression("FirstCell")).toEqual({
      kind: "cell",
      sheet: "Sheet1",
      cell: { col: 1, row: 1 },
    });
  });

  it("resolves a range named expression", () => {
    expect(bridge.resolveNamedExpression("SalesRange")).toEqual({
      kind: "range",
      sheet: "Sheet1",
      range: { start: { col: 0, row: 0 }, end: { col: 0, row: 9 } },
    });
  });

  it("resolves a local-scope named expression using the sheet scope", () => {
    expect(bridge.resolveNamedExpression("LocalCell")).toEqual({
      kind: "cell",
      sheet: "Sheet1",
      cell: { col: 2, row: 2 },
    });
  });
});

describe("resolveNamedExpression whole-column and whole-row", () => {
  class SpanHF {
    listNamedExpressions(scope?: number): string[] {
      if (scope === 0) {
        return [];
      }

      return ["ColumnA", "ColumnsAtoC", "Row1", "NoDimsCol"];
    }

    getNamedExpressionFormula(name: string): string | undefined {
      const formulas: Record<string, string> = {
        ColumnA: "=Sheet1!$A:$A",
        ColumnsAtoC: "=Sheet1!$A:$C",
        Row1: "=Sheet1!$1:$1",
        NoDimsCol: "=Empty!$A:$A",
      };

      return formulas[name];
    }

    simpleCellRangeFromString(): undefined {
      return undefined;
    }

    simpleCellAddressFromString(): undefined {
      return undefined;
    }

    getSheetId(sheetName: string): number | undefined {
      const ids: Record<string, number> = { Sheet1: 0, Empty: 1 };

      return ids[sheetName];
    }

    getSheetName(sheetId: number): string | undefined {
      const names: Record<number, string> = { 0: "Sheet1", 1: "Empty" };

      return names[sheetId];
    }

    getSheetDimensions(sheetId: number): { width: number; height: number } {
      if (sheetId === 1) {
        return { width: 0, height: 0 };
      }

      return { width: 5, height: 12 };
    }
  }

  const bridge = new EngineBridge({ hyperformula: new SpanHF() as never, sheetId: 0 });

  it("expands a whole-column named range to the sheet height", () => {
    expect(bridge.resolveNamedExpression("ColumnA")).toEqual({
      kind: "range",
      sheet: "Sheet1",
      range: { start: { col: 0, row: 0 }, end: { col: 0, row: 11 } },
    });
  });

  it("expands a multi-column span across the sheet height", () => {
    expect(bridge.resolveNamedExpression("ColumnsAtoC")).toEqual({
      kind: "range",
      sheet: "Sheet1",
      range: { start: { col: 0, row: 0 }, end: { col: 2, row: 11 } },
    });
  });

  it("expands a whole-row named range to the sheet width", () => {
    expect(bridge.resolveNamedExpression("Row1")).toEqual({
      kind: "range",
      sheet: "Sheet1",
      range: { start: { col: 0, row: 0 }, end: { col: 4, row: 0 } },
    });
  });

  it("falls back to scalar when the sheet has no dimensions", () => {
    expect(bridge.resolveNamedExpression("NoDimsCol")).toEqual({ kind: "scalar" });
  });
});

describe("EngineBridge sheet boundary", () => {
  const wholeColumnMeta: RangeRefMeta = {
    whole: "column",
    start: { col: 1, row: 0, abs: { col: false, row: false } },
    end: { col: 2, row: 0, abs: { col: false, row: false } },
  };

  it("isOwnSheet treats a missing sheet name as own sheet", () => {
    const bridge = new EngineBridge();

    expect(bridge.isOwnSheet(undefined)).toBe(true);
    expect(bridge.isOwnSheet("")).toBe(true);
  });

  it("isOwnSheet returns false for a named sheet without an engine", () => {
    const bridge = new EngineBridge();

    expect(bridge.isOwnSheet("Sheet1")).toBe(false);
  });

  it("isOwnSheet compares the engine sheet id against the own sheet id", () => {
    class SheetHF {
      getSheetId(sheetName: string) {
        return sheetName === "Own" ? 2 : 5;
      }
    }
    const bridge = new EngineBridge({ hyperformula: new SheetHF() as never, sheetId: 2 });

    expect(bridge.isOwnSheet("Own")).toBe(true);
    expect(bridge.isOwnSheet("Other")).toBe(false);
  });

  it("expandWholeRange returns null without an engine", () => {
    const bridge = new EngineBridge();

    expect(bridge.expandWholeRange(wholeColumnMeta)).toBeNull();
  });

  it("expandWholeRange expands a whole column to the sheet height", () => {
    class DimsHF {
      getSheetDimensions() {
        return { width: 10, height: 20 };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new DimsHF() as never });

    expect(bridge.expandWholeRange(wholeColumnMeta)).toEqual({
      start: { sheet: "", col: 1, row: 0 },
      end: { sheet: "", col: 2, row: 19 },
    });
  });

  it("expandWholeRange resolves a foreign sheet by name", () => {
    class ForeignHF {
      getSheetId(sheetName: string) {
        return sheetName === "Data" ? 3 : undefined;
      }

      getSheetDimensions(sheetId: number) {
        return sheetId === 3 ? { width: 4, height: 5 } : { width: 0, height: 0 };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new ForeignHF() as never });
    const meta: RangeRefMeta = {
      sheet: "Data",
      whole: "row",
      start: { col: 0, row: 1, abs: { col: false, row: false } },
      end: { col: 0, row: 2, abs: { col: false, row: false } },
    };

    expect(bridge.expandWholeRange(meta)).toEqual({
      start: { sheet: "Data", col: 0, row: 1 },
      end: { sheet: "Data", col: 3, row: 2 },
    });
  });

  it("expandWholeRange returns null for an unresolvable sheet name", () => {
    class NoSheetHF {
      getSheetId() {
        return undefined;
      }

      getSheetDimensions() {
        return { width: 10, height: 10 };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new NoSheetHF() as never });
    const meta: RangeRefMeta = { ...wholeColumnMeta, sheet: "Missing" };

    expect(bridge.expandWholeRange(meta)).toBeNull();
  });

  it("expandWholeRange returns null for empty sheet dimensions", () => {
    class EmptyHF {
      getSheetDimensions() {
        return { width: 0, height: 0 };
      }
    }
    const bridge = new EngineBridge({ hyperformula: new EmptyHF() as never });

    expect(bridge.expandWholeRange(wholeColumnMeta)).toBeNull();
  });
});

describe("EngineBridge cell value + change capture", () => {
  let fakeEngine: HyperFormulaLike;
  let bridge: EngineBridge;

  function useFakeEngine(): void {
    fakeEngine = {};
    bridge = new EngineBridge({ hyperformula: fakeEngine, sheetId: 0 });
  }

  it("reads a cell value through the optional engine accessor", () => {
    useFakeEngine();
    fakeEngine.getCellValue = vi.fn().mockReturnValue({ type: "NA", value: "#N/A" });

    const value = bridge.getCellValue({ sheet: "", row: 1, col: 2 });

    expect(value).toEqual({ type: "NA", value: "#N/A" });
  });

  it("returns undefined when the engine lacks getCellValue", () => {
    useFakeEngine();

    expect(bridge.getCellValue({ sheet: "", row: 0, col: 0 })).toBeUndefined();
  });

  it("returns undefined without an engine", () => {
    const engineless = new EngineBridge();

    expect(engineless.getCellValue({ sheet: "", row: 0, col: 0 })).toBeUndefined();
  });

  it("captures same-sheet value changes emitted during the operation", () => {
    useFakeEngine();
    const listeners: Array<(changes: unknown[]) => void> = [];
    fakeEngine.on = vi.fn((_event, listener) => listeners.push(listener));
    fakeEngine.off = vi.fn();

    const captured = bridge.captureValueChanges(() => {
      for (const listener of listeners) {
        listener([
          { address: { sheet: 0, row: 2, col: 1 }, newValue: { type: "NA", value: "#N/A" } },
          { address: { sheet: 5, row: 0, col: 0 }, newValue: 1 },
          { name: "rate", newValue: 2 },
        ]);
      }
    });

    expect(captured).toEqual([
      { address: { sheet: 0, row: 2, col: 1 }, newValue: { type: "NA", value: "#N/A" } },
    ]);
    expect(fakeEngine.off).toHaveBeenCalled();
  });

  it("runs the operation and returns no changes when the engine lacks events", () => {
    useFakeEngine();
    const operation = vi.fn();

    expect(bridge.captureValueChanges(operation)).toEqual([]);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("runs the operation and returns no changes without an engine", () => {
    const engineless = new EngineBridge();
    const operation = vi.fn();

    expect(engineless.captureValueChanges(operation)).toEqual([]);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
