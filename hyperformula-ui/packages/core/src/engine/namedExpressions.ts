import { indexToColLetters, quoteSheetName } from "../lexer/tokens";
import { expandWholeSpan } from "./namedExpr";
import type { HyperFormulaLike, NamedExprResolution } from "./types";

interface SimpleCellAddressLike {
  sheet: number;
  col: number;
  row: number;
}

interface SimpleCellRangeLike {
  start: SimpleCellAddressLike;
  end: SimpleCellAddressLike;
}

export class NamedExpressions {
  private readonly engine: HyperFormulaLike | undefined;
  private readonly sheetId: number;
  private scopeByUpperName: Map<string, number | "global"> | null = null;
  private resolveCache = new Map<string, NamedExprResolution | null>();
  private readonly onNamedExpressionChanged = (): void => this.invalidate();

  constructor(engine: HyperFormulaLike | undefined, sheetId: number) {
    this.engine = engine;
    this.sheetId = sheetId;
    this.engine?.on?.("namedExpressionAdded", this.onNamedExpressionChanged);
    this.engine?.on?.("namedExpressionRemoved", this.onNamedExpressionChanged);
  }

  private buildScopeByUpperName(): Map<string, number | "global"> {
    const scopeByUpperName = new Map<string, number | "global">();
    const global = this.engine?.listNamedExpressions?.() ?? [];

    for (const name of global) {
      scopeByUpperName.set(name.toUpperCase(), "global");
    }

    const local = this.engine?.listNamedExpressions?.(this.sheetId) ?? [];

    for (const name of local) {
      scopeByUpperName.set(name.toUpperCase(), this.sheetId);
    }

    return scopeByUpperName;
  }

  private namedExpressionScope(name: string): number | "global" | null {
    if (!this.scopeByUpperName) {
      this.scopeByUpperName = this.buildScopeByUpperName();
    }

    return this.scopeByUpperName.get(name.toUpperCase()) ?? null;
  }

  private sheetNameFor(sheetId: number): string {
    return this.engine?.getSheetName?.(sheetId) ?? "";
  }

  private resolveUncached(name: string): NamedExprResolution | null {
    if (!this.engine?.getNamedExpressionFormula) {
      return null;
    }

    const scope = this.namedExpressionScope(name);

    if (scope === null) {
      return null;
    }

    const formula = this.engine.getNamedExpressionFormula(
      name,
      scope === "global" ? undefined : scope,
    );

    if (!formula) {
      return { kind: "scalar" };
    }

    const body = formula.replace(/^=/, "");
    const range = this.engine.simpleCellRangeFromString?.(body, this.sheetId) as
      | SimpleCellRangeLike
      | undefined;

    if (range) {
      return {
        kind: "range",
        sheet: this.sheetNameFor(range.start.sheet),
        range: {
          start: { col: range.start.col, row: range.start.row },
          end: { col: range.end.col, row: range.end.row },
        },
      };
    }

    const cell = this.engine.simpleCellAddressFromString?.(body, this.sheetId) as
      | SimpleCellAddressLike
      | undefined;

    if (cell) {
      return {
        kind: "cell",
        sheet: this.sheetNameFor(cell.sheet),
        cell: { col: cell.col, row: cell.row },
      };
    }

    return expandWholeSpan(this.engine, this.sheetId, body) ?? { kind: "scalar" };
  }

  filter(prefix: string): string[] {
    const local = this.engine?.listNamedExpressions?.(this.sheetId) ?? [];
    const global = this.engine?.listNamedExpressions?.() ?? [];
    const all = [...new Set([...local, ...global])];

    if (!prefix) {
      return all.slice(0, 20);
    }

    const upperPrefix = prefix.toUpperCase();

    return all.filter((name) => name.toUpperCase().includes(upperPrefix)).slice(0, 20);
  }

  formatRange(name: string): string | undefined {
    const resolution = this.resolve(name);

    if (!resolution || resolution.kind === "scalar") {
      return undefined;
    }

    if (resolution.kind === "cell") {
      const col = indexToColLetters(resolution.cell.col);
      const row = resolution.cell.row + 1;
      const sheetPrefix = resolution.sheet ? `${quoteSheetName(resolution.sheet)}!` : "";

      return `${sheetPrefix}${col}${row}`;
    }

    const startCol = indexToColLetters(resolution.range.start.col);
    const startRow = resolution.range.start.row + 1;
    const endCol = indexToColLetters(resolution.range.end.col);
    const endRow = resolution.range.end.row + 1;
    const sheetPrefix = resolution.sheet ? `${quoteSheetName(resolution.sheet)}!` : "";

    return `${sheetPrefix}${startCol}${startRow}:${endCol}${endRow}`;
  }

  resolve(name: string): NamedExprResolution | null {
    if (this.resolveCache.has(name)) {
      return this.resolveCache.get(name) ?? null;
    }

    const resolution = this.resolveUncached(name);

    this.resolveCache.set(name, resolution);

    return resolution;
  }

  invalidate(): void {
    this.scopeByUpperName = null;
    this.resolveCache.clear();
  }

  destroy(): void {
    this.engine?.off?.("namedExpressionAdded", this.onNamedExpressionChanged);
    this.engine?.off?.("namedExpressionRemoved", this.onNamedExpressionChanged);
  }
}
