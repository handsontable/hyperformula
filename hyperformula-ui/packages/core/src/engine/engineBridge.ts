import { expandWholeRange } from "../adapter/range";
import type { CellRange } from "../adapter/types";
import type { LexerOptions, RangeRefMeta } from "../lexer/types";
import { FunctionCatalog } from "./functionCatalog";
import { NamedExpressions } from "./namedExpressions";
import type {
  EngineCellAddress,
  EngineValueChange,
  FunctionCatalogEntry,
  FunctionSignature,
  HyperFormulaLike,
  NamedExprResolution,
} from "./types";

const DEFAULT_SEPARATORS: LexerOptions = {
  decimalSeparator: ".",
  argSeparator: ",",
  arrayColumnSeparator: ",",
  arrayRowSeparator: ";",
};

export class EngineBridge {
  private readonly engine: HyperFormulaLike | undefined;
  private readonly language: string;
  private readonly sheetId: number;
  private readonly functions: FunctionCatalog;
  private readonly namedExprs: NamedExpressions;

  constructor(
    opts: {
      hyperformula?: HyperFormulaLike;
      language?: string;
      sheetId?: number;
    } = {},
  ) {
    this.engine = opts.hyperformula;
    this.language = opts.language ?? "enGB";
    this.sheetId = opts.sheetId ?? 0;
    this.functions = new FunctionCatalog(this.engine, this.language);
    this.namedExprs = new NamedExpressions(this.engine, this.sheetId);
  }

  private isOwnSheetChange(candidate: unknown): candidate is EngineValueChange {
    if (typeof candidate !== "object" || candidate === null || !("address" in candidate)) {
      return false;
    }

    const { address } = candidate as { address: EngineCellAddress };

    return address.sheet === this.sheetId;
  }

  getSeparators(): LexerOptions {
    const config = this.engine?.getConfig?.();

    if (!config) {
      return { ...DEFAULT_SEPARATORS };
    }

    return {
      decimalSeparator: config.decimalSeparator ?? DEFAULT_SEPARATORS.decimalSeparator,
      argSeparator: config.functionArgSeparator ?? DEFAULT_SEPARATORS.argSeparator,
      arrayColumnSeparator: config.arrayColumnSeparator ?? DEFAULT_SEPARATORS.arrayColumnSeparator,
      arrayRowSeparator: config.arrayRowSeparator ?? DEFAULT_SEPARATORS.arrayRowSeparator,
    };
  }

  getCellValue(address: { sheet: string; row: number; col: number }): unknown {
    if (!this.engine?.getCellValue) {
      return undefined;
    }

    const sheetId = address.sheet ? this.engine.getSheetId?.(address.sheet) : this.sheetId;

    if (sheetId === undefined) {
      return undefined;
    }

    return this.engine.getCellValue({ sheet: sheetId, row: address.row, col: address.col });
  }

  captureValueChanges(operation: () => void): EngineValueChange[] {
    if (!this.engine?.on || !this.engine.off) {
      operation();

      return [];
    }

    const captured: EngineValueChange[] = [];
    const listener = (changes: unknown[]): void => {
      for (const change of changes) {
        if (this.isOwnSheetChange(change)) {
          captured.push(change);
        }
      }
    };

    this.engine.on("valuesUpdated", listener);

    try {
      operation();
    } finally {
      this.engine.off("valuesUpdated", listener);
    }

    return captured;
  }

  isOwnSheet(sheetName: string | undefined): boolean {
    if (!sheetName) {
      return true;
    }

    return this.engine?.getSheetId?.(sheetName) === this.sheetId;
  }

  expandWholeRange(meta: RangeRefMeta): CellRange | null {
    if (!this.engine?.getSheetDimensions) {
      return null;
    }

    const sheetName = meta.sheet ?? "";
    const sheetId = meta.sheet ? this.engine.getSheetId?.(meta.sheet) : this.sheetId;

    if (sheetId === undefined) {
      return null;
    }

    const dimensions = this.engine.getSheetDimensions(sheetId);

    if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
      return null;
    }

    return expandWholeRange(meta, sheetName, dimensions);
  }

  getFunctionCatalog(): FunctionCatalogEntry[] {
    return this.functions.getCatalog();
  }

  getFunctionNames(): string[] {
    return this.functions.getNames();
  }

  getFunctionSignature(name: string): FunctionSignature | null {
    return this.functions.getSignature(name);
  }

  filterFunctionEntries(prefix: string): FunctionCatalogEntry[] {
    return this.functions.filterEntries(prefix);
  }

  filterFunctions(prefix: string): string[] {
    return this.functions.filterNames(prefix);
  }

  filterNamedExpressions(prefix: string): string[] {
    return this.namedExprs.filter(prefix);
  }

  formatNamedRange(name: string): string | undefined {
    return this.namedExprs.formatRange(name);
  }

  resolveNamedExpression(name: string): NamedExprResolution | null {
    return this.namedExprs.resolve(name);
  }

  invalidateNamedExpressionCache(): void {
    this.namedExprs.invalidate();
  }

  destroy(): void {
    this.namedExprs.destroy();
  }
}
