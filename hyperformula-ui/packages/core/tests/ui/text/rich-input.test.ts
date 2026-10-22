import { describe, expect, it, vi } from "vitest";
import { EventManager } from "../../../src/events/eventManager";
import { CN } from "../../../src/theme/classNames";
import { RichInput } from "../../../src/ui/text/richInput";

interface RichInputHarness {
  input: RichInput;
  textarea: HTMLTextAreaElement;
  disposeListeners: () => void;
  destroy: () => void;
}

function createRichInputHarness(): RichInputHarness {
  const events = new EventManager();
  const scope = events.createScope("rich-input-test");
  const input = new RichInput(scope);

  scope.activate();
  document.body.appendChild(input.textarea);

  return {
    input,
    textarea: input.textarea,
    disposeListeners: () => events.disposeAll(),
    destroy: () => {
      events.disposeAll();
      input.textarea.remove();
    },
  };
}

function placeCaret(textarea: HTMLTextAreaElement, offset: number): void {
  textarea.selectionStart = offset;
  textarea.selectionEnd = offset;
}

describe("RichInput", () => {
  it("renders a single-row textarea configured for plain formula input", () => {
    const harness = createRichInputHarness();

    expect(harness.textarea.classList.contains(CN.editorInput)).toBe(true);
    expect(harness.textarea.getAttribute("spellcheck")).toBe("false");
    expect(harness.textarea.getAttribute("autocapitalize")).toBe("off");
    expect(harness.textarea.getAttribute("autocomplete")).toBe("off");
    expect(harness.textarea.getAttribute("autocorrect")).toBe("off");
    expect(harness.textarea.getAttribute("wrap")).toBe("soft");
    expect(harness.textarea.getAttribute("rows")).toBe("1");
    expect(harness.textarea.getAttribute("aria-label")).toBe("Formula editor");

    harness.destroy();
  });

  it("exposes the combobox contract on the textarea", () => {
    const harness = createRichInputHarness();

    expect(harness.textarea.getAttribute("role")).toBe("combobox");
    expect(harness.textarea.getAttribute("aria-haspopup")).toBe("listbox");
    expect(harness.textarea.getAttribute("aria-expanded")).toBe("false");

    harness.destroy();
  });

  it("emits input with the current text and caret on native input events", () => {
    const harness = createRichInputHarness();
    const onInput = vi.fn();

    harness.input.on("input", onInput);
    harness.textarea.value = "=SUM(1";
    placeCaret(harness.textarea, 4);
    harness.textarea.dispatchEvent(new Event("input"));

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledWith("=SUM(1", 4);

    harness.destroy();
  });

  it("suppresses input events during composition and emits once on compositionend", () => {
    const harness = createRichInputHarness();
    const onInput = vi.fn();

    harness.input.on("input", onInput);
    harness.textarea.dispatchEvent(new Event("compositionstart"));
    harness.textarea.value = "=あ";
    placeCaret(harness.textarea, 2);
    harness.textarea.dispatchEvent(new Event("input"));

    expect(onInput).not.toHaveBeenCalled();

    harness.textarea.dispatchEvent(new Event("compositionend"));

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledWith("=あ", 2);

    harness.destroy();
  });

  it("emits caretmove on keyup, click, and select", () => {
    const harness = createRichInputHarness();
    const onCaretMove = vi.fn();

    harness.input.on("caretmove", onCaretMove);
    harness.textarea.value = "=A1+B2";

    placeCaret(harness.textarea, 3);
    onCaretMove.mockClear();
    harness.textarea.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowLeft" }));

    expect(onCaretMove).toHaveBeenCalledTimes(1);
    expect(onCaretMove).toHaveBeenCalledWith(3);

    placeCaret(harness.textarea, 5);
    onCaretMove.mockClear();
    harness.textarea.dispatchEvent(new MouseEvent("click"));

    expect(onCaretMove).toHaveBeenCalledTimes(1);
    expect(onCaretMove).toHaveBeenCalledWith(5);

    placeCaret(harness.textarea, 1);
    onCaretMove.mockClear();
    harness.textarea.dispatchEvent(new Event("select"));

    expect(onCaretMove).toHaveBeenCalledTimes(1);
    expect(onCaretMove).toHaveBeenCalledWith(1);

    harness.destroy();
  });

  it("reports focus and blur through the focus handler", () => {
    const harness = createRichInputHarness();
    const onFocusChange = vi.fn();

    harness.input.on("focus", onFocusChange);
    harness.textarea.dispatchEvent(new Event("focus"));
    harness.textarea.dispatchEvent(new Event("blur"));

    expect(onFocusChange.mock.calls).toEqual([
      [true, null],
      [false, null],
    ]);

    harness.destroy();
  });

  it("forwards keydown events to the keydown handler", () => {
    const harness = createRichInputHarness();
    const onKeydown = vi.fn();

    harness.input.on("keydown", onKeydown);
    const keydownEvent = new KeyboardEvent("keydown", { key: "Enter" });

    harness.textarea.dispatchEvent(keydownEvent);

    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect(onKeydown).toHaveBeenCalledWith(keydownEvent);

    harness.destroy();
  });

  it("round-trips text through setText and getText", () => {
    const harness = createRichInputHarness();

    harness.input.setText("=SUM(A1:A5)");

    expect(harness.input.getText()).toBe("=SUM(A1:A5)");
    expect(harness.textarea.value).toBe("=SUM(A1:A5)");

    harness.destroy();
  });

  it("collapses the selection at the given offset via setCaret", () => {
    const harness = createRichInputHarness();

    harness.input.setText("=SUM(1)");
    harness.input.setCaret(3);

    expect(harness.input.getCaret()).toBe(3);
    expect(harness.input.getSelectionEnd()).toBe(3);

    harness.destroy();
  });

  it("reports both ends of an active selection", () => {
    const harness = createRichInputHarness();

    harness.input.setText("=A1+B2");
    harness.textarea.setSelectionRange(1, 4);

    expect(harness.input.getCaret()).toBe(1);
    expect(harness.input.getSelectionEnd()).toBe(4);

    harness.destroy();
  });

  it("splices the value, moves the caret after the insertion, and emits input on replaceRange", () => {
    const harness = createRichInputHarness();
    const onInput = vi.fn();

    harness.input.setText("=SUM()");
    harness.input.on("input", onInput);
    harness.input.replaceRange(1, 4, "AVERAGE");

    expect(harness.input.getText()).toBe("=AVERAGE()");
    expect(harness.input.getCaret()).toBe(8);
    expect(harness.input.getSelectionEnd()).toBe(8);
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledWith("=AVERAGE()", 8);

    harness.destroy();
  });

  it("moves document focus to the textarea via focus()", () => {
    const harness = createRichInputHarness();

    harness.input.focus();

    expect(document.activeElement).toBe(harness.textarea);

    harness.destroy();
  });

  it("stops emitting once its event scope is disposed", () => {
    const harness = createRichInputHarness();
    const onInput = vi.fn();
    const onCaretMove = vi.fn();

    harness.input.on("input", onInput);
    harness.input.on("caretmove", onCaretMove);
    harness.disposeListeners();
    harness.textarea.value = "=1";
    harness.textarea.dispatchEvent(new Event("input"));
    harness.textarea.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowLeft" }));

    expect(onInput).not.toHaveBeenCalled();
    expect(onCaretMove).not.toHaveBeenCalled();

    harness.textarea.remove();
  });
});
