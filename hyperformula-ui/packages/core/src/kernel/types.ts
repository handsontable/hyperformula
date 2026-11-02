import type { Token } from "../lexer/types";

export interface CursorPosition {
  offset: number;
  selectionEnd?: number;
}

export interface FormulaState {
  text: string;
  cursor: CursorPosition;
  tokens: Token[];
}

export interface KernelEventMap {
  change: { state: FormulaState };
  tokenize: { tokens: Token[]; text: string };
  caretmove: { cursor: CursorPosition };
  focus: { focused: boolean };
  "popup:close": Record<string, never>;
}

export type KernelEventName = keyof KernelEventMap;
