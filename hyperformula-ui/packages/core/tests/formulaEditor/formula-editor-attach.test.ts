import { describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import { PopupContext } from "../../src/ui/popup/popupContext";

function make(): {
  editor: FormulaEditor;
  host: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  popupCtx: PopupContext;
} {
  const host = document.createElement("div");
  const popupCtx = new PopupContext();
  const editor = new FormulaEditor(host, { popupCtx, adapter: new NullAdapter() });
  const textarea = host.querySelector("textarea") as HTMLTextAreaElement;

  return { editor, host, textarea, popupCtx };
}

describe("FormulaEditor.attachTo", () => {
  it("moves the editor DOM into the new container and preserves the value", () => {
    const { editor, host, popupCtx } = make();
    editor.setValue("=A1+1");
    const target = document.createElement("div");

    editor.attachTo(target);

    expect(host.querySelector("textarea")).toBeNull();
    expect(target.querySelector("textarea")).not.toBeNull();
    expect(editor.getValue()).toBe("=A1+1");

    editor.destroy();
    popupCtx.destroy();
  });

  it("restores focus and caret when the editor was focused before the move", () => {
    const { editor, host, textarea, popupCtx } = make();
    document.body.appendChild(host);
    editor.setValue("=SUM(A1)");
    textarea.dispatchEvent(new Event("focus"));
    editor.setCaretOffset(5);
    const target = document.createElement("div");
    document.body.appendChild(target);

    editor.attachTo(target);

    expect(editor.isFocused()).toBe(true);
    expect(editor.getCaretOffset()).toBe(5);

    editor.destroy();
    popupCtx.destroy();
    host.remove();
    target.remove();
  });
});
