import type { Token } from "../lexer/types";
import type { CursorPosition, FormulaState } from "./types";

export class StateManager {
  private state: FormulaState;

  constructor(initial?: Partial<FormulaState>) {
    this.state = {
      text: initial?.text ?? "",
      cursor: initial?.cursor ?? { offset: 0 },
      tokens: initial?.tokens ?? [],
    };
  }

  snapshot(): FormulaState {
    return {
      text: this.state.text,
      cursor: { ...this.state.cursor },
      tokens: this.state.tokens,
    };
  }

  setText(text: string, cursor?: CursorPosition): void {
    this.state = { ...this.state, text, cursor: cursor ?? this.state.cursor };
  }

  setCursor(cursor: CursorPosition): void {
    this.state = { ...this.state, cursor: { ...cursor } };
  }

  setTokens(tokens: Token[]): void {
    this.state = { ...this.state, tokens };
  }

  getText(): string {
    return this.state.text;
  }

  getCursor(): CursorPosition {
    return { ...this.state.cursor };
  }

  getTokens(): Token[] {
    return this.state.tokens;
  }
}
