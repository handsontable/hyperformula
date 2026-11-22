import type { EventScope } from "../../events/eventManager";
import { CN } from "../../theme/classNames";
import { createEl } from "../dom";
import { DEFAULT_PHRASES } from "../phrases";

let inputIdCounter = 0;

export interface RichInputEventMap {
  input: (text: string, caret: number) => void;
  caretmove: (caret: number) => void;
  keydown: (event: KeyboardEvent) => void;
  focus: (focused: boolean, relatedTarget: EventTarget | null) => void;
}

export class RichInput {
  readonly textarea: HTMLTextAreaElement;
  private readonly handlers: Partial<RichInputEventMap> = {};
  private composing = false;

  constructor(
    private readonly scope: EventScope,
    label = DEFAULT_PHRASES.formulaEditor,
  ) {
    inputIdCounter += 1;
    this.textarea = createEl("textarea", {
      class: CN.editorInput,
      id: `${CN.editorInput}-${inputIdCounter}`,
      spellcheck: "false",
      autocapitalize: "off",
      autocomplete: "off",
      autocorrect: "off",
      wrap: "soft",
      dir: "ltr",
      rows: "1",
      "aria-label": label,
      "aria-autocomplete": "list",
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
    });
    this.bind();
  }

  private bind(): void {
    this.scope.listen(this.textarea, "input", () => {
      if (this.composing) {
        return;
      }

      this.handlers.input?.(this.textarea.value, this.textarea.selectionStart ?? 0);
    });
    this.scope.listen(this.textarea, "keyup", () => this.emitCaret());
    this.scope.listen(this.textarea, "click", () => this.emitCaret());
    this.scope.listen(this.textarea, "select", () => this.emitCaret());
    this.scope.listen(this.textarea, "focus", () => this.handlers.focus?.(true, null));
    this.scope.listen(this.textarea, "blur", (event) =>
      this.handlers.focus?.(false, event.relatedTarget ?? null),
    );
    this.scope.listen(this.textarea, "keydown", (event) => {
      if (this.composing || event.isComposing || event.keyCode === 229) {
        return;
      }

      this.handlers.keydown?.(event);
    });
    this.scope.listen(this.textarea, "compositionstart", () => {
      this.composing = true;
    });
    this.scope.listen(this.textarea, "compositionend", () => {
      this.composing = false;
      this.handlers.input?.(this.textarea.value, this.textarea.selectionStart ?? 0);
    });
  }

  private emitCaret(): void {
    this.handlers.caretmove?.(this.textarea.selectionStart ?? 0);
  }

  on<K extends keyof RichInputEventMap>(name: K, callback: RichInputEventMap[K]): void {
    this.handlers[name] = callback;
  }

  getText(): string {
    return this.textarea.value;
  }

  setText(text: string): void {
    this.textarea.value = text;
  }

  getCaret(): number {
    return this.textarea.selectionStart ?? 0;
  }

  getSelectionEnd(): number {
    return this.textarea.selectionEnd ?? this.getCaret();
  }

  setCaret(offset: number): void {
    this.textarea.setSelectionRange(offset, offset);
  }

  replaceRange(start: number, end: number, value: string): void {
    const before = this.textarea.value.slice(0, start);
    const after = this.textarea.value.slice(end);

    this.textarea.value = before + value + after;
    const newCaret = start + value.length;

    this.textarea.setSelectionRange(newCaret, newCaret);
    this.handlers.input?.(this.textarea.value, newCaret);
  }

  focus(): void {
    this.textarea.focus();
  }
}
