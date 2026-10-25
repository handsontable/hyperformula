import { afterEach, describe, expect, it, vi } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { keyUp, requireTextarea, typeInto } from "../helpers";

function make(): { editor: FormulaEditor; host: HTMLDivElement; popupCtx: PopupContext } {
  const host = document.createElement("div");
  const popupCtx = new PopupContext();
  const editor = new FormulaEditor(host, { popupCtx, adapter: new NullAdapter() });

  return { editor, host, popupCtx };
}

describe("FormulaEditor caret pipeline dedup", () => {
  let editor: FormulaEditor;
  let host: HTMLDivElement;
  let popupCtx: PopupContext;

  afterEach(() => {
    editor.destroy();
    popupCtx.destroy();
  });

  it("does not re-run afterMutation/maybeShowPopup on a keyup that repeats the caret an input already applied", () => {
    ({ editor, host, popupCtx } = make());
    typeInto(host, "=A1");

    // biome-ignore lint/suspicious/noExplicitAny: accessing private controllers for test assertion
    const highlights = (editor as any).highlights;
    // biome-ignore lint/suspicious/noExplicitAny: accessing private controllers for test assertion
    const popupCtrl = (editor as any).popupCtrl;
    const afterMutationSpy = vi.spyOn(highlights, "afterMutation");
    const maybeShowPopupSpy = vi.spyOn(popupCtrl, "maybeShowPopup");

    keyUp(host, "1");

    expect(afterMutationSpy).not.toHaveBeenCalled();
    expect(maybeShowPopupSpy).not.toHaveBeenCalled();
  });

  it("still emits caretmove and re-runs the pipeline for a genuine ArrowLeft caret move", () => {
    ({ editor, host, popupCtx } = make());
    typeInto(host, "=A1");

    // biome-ignore lint/suspicious/noExplicitAny: accessing private controllers for test assertion
    const highlights = (editor as any).highlights;
    // biome-ignore lint/suspicious/noExplicitAny: accessing private controllers for test assertion
    const popupCtrl = (editor as any).popupCtrl;
    const afterMutationSpy = vi.spyOn(highlights, "afterMutation");
    const maybeShowPopupSpy = vi.spyOn(popupCtrl, "maybeShowPopup");
    const textarea = requireTextarea(host);

    textarea.selectionStart = 1;
    textarea.selectionEnd = 1;
    keyUp(host, "ArrowLeft");

    expect(afterMutationSpy).toHaveBeenCalledTimes(1);
    expect(maybeShowPopupSpy).toHaveBeenCalledTimes(1);
    expect(editor.getCaretOffset()).toBe(1);
  });
});
