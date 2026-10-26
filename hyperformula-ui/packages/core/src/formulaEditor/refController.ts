import { TokenType } from "../lexer/tokens";
import type { Token } from "../lexer/types";
import { isFormula } from "./editorContext";
import { applyEditorEdit } from "./editorEdit";
import type { HighlightController } from "./highlightController";
import type { EditorContext } from "./types";

export class RefController {
  private lastRef: { start: number; end: number; value: string } | null = null;
  private refActive = true;

  constructor(
    private readonly ctx: EditorContext,
    private readonly highlights: HighlightController,
    private readonly onRefChange: () => void,
  ) {}

  private isLastRefIntact(lr: { start: number; end: number; value: string }): boolean {
    return this.ctx.kernel.getState().text.slice(lr.start, lr.end) === lr.value;
  }

  private commitLastRef(
    replaceStart: number,
    replaceEnd: number,
    insertText: string,
    refStart: number,
    refStr: string,
  ): void {
    this.lastRef = { start: refStart, end: refStart + refStr.length, value: refStr };
    applyEditorEdit(this.ctx, this.highlights, {
      start: replaceStart,
      end: replaceEnd,
      text: insertText,
      caret: refStart + refStr.length,
    });
    this.ctx.input.focus();
    this.onRefChange();
  }

  hasPendingRefAtCaret(): boolean {
    const lr = this.lastRef;

    return lr !== null && this.ctx.input.getCaret() === lr.end && this.isLastRefIntact(lr);
  }

  isRefActive(): boolean {
    return this.refActive;
  }

  resetLastRef(): void {
    this.lastRef = null;
  }

  markPendingRef(start: number, value: string): void {
    this.lastRef = { start, end: start + value.length, value };
  }

  clearPendingRef(): void {
    const lr = this.lastRef;

    if (lr && this.hasPendingRefAtCaret()) {
      applyEditorEdit(this.ctx, this.highlights, {
        start: lr.start,
        end: lr.end,
        text: "",
        caret: lr.start,
      });
      this.onRefChange();
    }

    this.lastRef = null;
  }

  setRefActive(active: boolean): void {
    this.refActive = active;

    if (!active) {
      this.ctx.suggestions.close();
      this.ctx.fnHelp.close();
    }
  }

  tryInsertRef(refStr: string, force = false, append = false): void {
    if (!this.refActive) {
      return;
    }

    const lr = this.lastRef;

    if (append && lr && this.hasPendingRefAtCaret()) {
      const insertAt = lr.end;
      const joined = `${this.ctx.argSeparator}${refStr}`;

      this.commitLastRef(
        insertAt,
        insertAt,
        joined,
        insertAt + this.ctx.argSeparator.length,
        refStr,
      );

      return;
    }

    if (lr && this.hasPendingRefAtCaret()) {
      this.commitLastRef(lr.start, lr.end, refStr, lr.start, refStr);

      return;
    }

    const token = this.refTokenAtCaret();

    if (token && append) {
      const joined = `${this.ctx.argSeparator}${refStr}`;

      this.commitLastRef(
        token.end,
        token.end,
        joined,
        token.end + this.ctx.argSeparator.length,
        refStr,
      );

      return;
    }

    if (token) {
      this.commitLastRef(token.start, token.end, refStr, token.start, refStr);

      return;
    }

    if (!force && !this.canInsertRef()) {
      return;
    }

    const start = this.ctx.input.getCaret();

    this.commitLastRef(start, this.ctx.input.getSelectionEnd(), refStr, start, refStr);
  }

  refTokenAtCaret(): Token | null {
    if (!isFormula(this.ctx.kernel)) {
      return null;
    }

    const caret = this.ctx.input.getCaret();
    const token = this.ctx.kernel
      .getTokens()
      .find(
        (candidate) =>
          (candidate.type === TokenType.CELL_REF || candidate.type === TokenType.RANGE_REF) &&
          caret >= candidate.start &&
          caret <= candidate.end,
      );

    return token ?? null;
  }

  canInsertRef(): boolean {
    if (!isFormula(this.ctx.kernel)) {
      return false;
    }

    const text = this.ctx.kernel.getState().text;
    let index = this.ctx.input.getCaret() - 1;

    while (index >= 0 && (text[index] === " " || text[index] === "\t" || text[index] === "\n")) {
      index--;
    }

    if (index < 0) {
      return false;
    }

    return this.ctx.refOpeners.includes(text[index] ?? "");
  }

  isRefSelectionActive(): boolean {
    return (
      this.refActive &&
      (this.canInsertRef() || this.hasPendingRefAtCaret() || this.refTokenAtCaret() !== null)
    );
  }

  pendingRefRange(): { start: number; end: number } | null {
    const lr = this.lastRef;

    if (!lr || !this.hasPendingRefAtCaret()) {
      return null;
    }

    return { start: lr.start, end: lr.end };
  }
}
