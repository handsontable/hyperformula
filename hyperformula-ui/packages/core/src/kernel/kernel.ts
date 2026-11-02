import { Lexer } from "../lexer/lexer";
import type { LexerOptions, Token } from "../lexer/types";
import { EventBus } from "./eventBus";
import { StateManager } from "./stateManager";
import type { CursorPosition, FormulaState } from "./types";

export class Kernel {
  readonly bus = new EventBus();
  readonly state = new StateManager();
  private readonly lexer: Lexer;
  tokenPostProcess?: (tokens: Token[], text: string) => Token[];

  constructor(lexerOptions: Partial<LexerOptions> = {}) {
    this.lexer = new Lexer(lexerOptions);
  }

  applyEdit(text: string, cursor: CursorPosition): void {
    this.state.setText(text, cursor);
    const lexed = this.lexer.tokenize(text);
    const tokens = this.tokenPostProcess ? this.tokenPostProcess(lexed, text) : lexed;

    this.state.setTokens(tokens);
    this.bus.emit("tokenize", { tokens, text });
    this.bus.emit("change", { state: this.state.snapshot() });
  }

  setCaret(cursor: CursorPosition): boolean {
    const current = this.state.getCursor();

    if (cursor.offset === current.offset && cursor.selectionEnd === current.selectionEnd) {
      return false;
    }

    this.state.setCursor(cursor);
    this.bus.emit("caretmove", { cursor });

    return true;
  }

  replaceRange(start: number, end: number, value: string): void {
    const text = this.state.getText();
    const newText = text.slice(0, start) + value + text.slice(end);
    const newOffset = start + value.length;

    this.applyEdit(newText, { offset: newOffset });
  }

  getTokens(): Token[] {
    return this.state.getTokens();
  }

  getState(): FormulaState {
    return this.state.snapshot();
  }
}
