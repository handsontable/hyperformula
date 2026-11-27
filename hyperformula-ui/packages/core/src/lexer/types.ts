import type { TokenType } from "./tokens";

export interface CellRefMeta {
  sheet?: string;
  col: number;
  row: number;
  abs: { col: boolean; row: boolean };
}

export interface RangeRefMeta {
  sheet?: string;
  whole?: "column" | "row";
  start: { col: number; row: number; abs: { col: boolean; row: boolean } };
  end: { col: number; row: number; abs: { col: boolean; row: boolean } };
}

export interface CommentMeta {
  text: string;
  contextOk: boolean;
}

export type NamedExprMeta =
  | { named: true; kind: "scalar" }
  | { named: true; kind: "cell"; sheet: string; cell: { col: number; row: number } }
  | {
      named: true;
      kind: "range";
      sheet: string;
      range: { start: { col: number; row: number }; end: { col: number; row: number } };
    };

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  meta?: CellRefMeta | RangeRefMeta | CommentMeta | NamedExprMeta | Record<string, unknown>;
}

/**
 * The sheet size a reference must fit in to lex as a reference, matching the engine's
 * `maxColumns` and `maxRows` config.
 */
export interface ReferenceLimits {
  /**
   * The number of columns: a column index at or past it is not a reference.
   */
  maxColumns: number;

  /**
   * The number of rows: a row index at or past it is not a reference.
   */
  maxRows: number;
}

export interface LexerSeparators {
  decimalSeparator: string;
  argSeparator: string;
  arrayColumnSeparator: string;
  arrayRowSeparator: string;
}

export interface LexerOptions extends LexerSeparators, ReferenceLimits {}
