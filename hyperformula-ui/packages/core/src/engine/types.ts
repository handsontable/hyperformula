/**
 * One parameter of a {@link FunctionSignature}, as shown in the function-help popup.
 *
 * @category Engine
 */
export interface FunctionParam {
  label: string;
  optional: boolean;
  description?: string;
}

/**
 * A function's full signature for the function-help popup; `repeatLast` is how many trailing
 * params repeat variadically (`0` = none).
 *
 * @category Engine
 */
export interface FunctionSignature {
  name: string;
  params: FunctionParam[];
  repeatLast: number;
  description?: string;
  example?: string;
  docUrl?: string;
}

/**
 * One autocomplete entry: the (possibly localized) `name` plus the engine's `canonicalName`.
 *
 * @category Engine
 */
export interface FunctionCatalogEntry {
  name: string;
  canonicalName: string;
  category: string;
  shortDescription: string;
}

interface HyperFormulaConfig {
  language?: string;
  decimalSeparator?: string;
  functionArgSeparator?: string;
  arrayColumnSeparator?: string;
  arrayRowSeparator?: string;
}

/**
 * Structural stand-in for a HyperFormula instance, so hyperformula stays an optional peer
 * dependency. Raw `HyperFormulaLike` is never touched outside `src/engine/` — everything else
 * reaches engine facts through the engine bridge.
 *
 * @category Engine
 */
export interface HyperFormulaLike {
  simpleCellAddressFromString?(addressString: string, sheetId?: number): unknown;
  simpleCellRangeFromString?(rangeString: string, sheetId: number): unknown;
  getConfig?(): HyperFormulaConfig;
  getSheetId?(sheetName: string): number | undefined;
  getSheetName?(sheetId: number): string | undefined;
  listNamedExpressions?(scope?: number): string[];
  getNamedExpressionFormula?(expressionName: string, scope?: number): string | undefined;
  getSheetDimensions?(sheetId: number): { width: number; height: number };
  getCellValue?(address: EngineCellAddress): unknown;
  getAvailableFunctions?(): unknown;
  getFunctionDetails?(canonicalName: string): unknown;
  getRegisteredFunctionNames?(): string[];
  getFunctionPlugin?(functionId: string): unknown;
  on?(event: "valuesUpdated", listener: (changes: unknown[]) => void): void;
  on?(event: "namedExpressionAdded", listener: (name: string) => void): void;
  on?(event: "namedExpressionRemoved", listener: (name: string) => void): void;
  on?(event: "sheetRemoved", listener: (sheetName: string) => void): void;
  off?(event: "valuesUpdated", listener: (changes: unknown[]) => void): void;
  off?(event: "namedExpressionAdded", listener: (name: string) => void): void;
  off?(event: "namedExpressionRemoved", listener: (name: string) => void): void;
  off?(event: "sheetRemoved", listener: (sheetName: string) => void): void;
}

export type NamedExprResolution =
  | { kind: "scalar" }
  | { kind: "cell"; sheet: string; cell: { col: number; row: number } }
  | {
      kind: "range";
      sheet: string;
      range: { start: { col: number; row: number }; end: { col: number; row: number } };
    };

/**
 * Engine-space cell address: `sheet` is the numeric HyperFormula sheet id, unlike the
 * string-sheet adapter `CellAddress`.
 *
 * @category Engine
 */
export interface EngineCellAddress {
  sheet: number;
  row: number;
  col: number;
}

/**
 * One engine cell whose value changed during a commit, as captured by
 * `captureValueChanges`.
 *
 * @category Engine
 */
export interface EngineValueChange {
  address: EngineCellAddress;
  newValue: unknown;
}

/**
 * Minimal read surface `readCellText` pulls from — any HyperFormula-like object (or test
 * fake) exposing some of the three cell readers qualifies.
 *
 * @category Engine
 */
export interface CellTextSource {
  getCellFormula?(address: EngineCellAddress): string | undefined;
  getCellSerialized?(address: EngineCellAddress): unknown;
  getCellValue?(address: EngineCellAddress): unknown;
}
