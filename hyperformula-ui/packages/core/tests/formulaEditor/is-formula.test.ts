import { describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import { PopupContext } from "../../src/ui/popup/popupContext";

function make(): { editor: FormulaEditor; popupCtx: PopupContext } {
  const host = document.createElement("div");
  const popupCtx = new PopupContext();
  const editor = new FormulaEditor(host, { popupCtx, adapter: new NullAdapter() });

  return { editor, popupCtx };
}

describe("FormulaEditor.isFormula", () => {
  it("reports true for formula text and false otherwise", () => {
    const { editor, popupCtx } = make();

    editor.setValue("=SUM(A1:B2)");
    expect(editor.isFormula()).toBe(true);

    editor.setValue("plain text");
    expect(editor.isFormula()).toBe(false);

    editor.setValue("");
    expect(editor.isFormula()).toBe(false);

    editor.destroy();
    popupCtx.destroy();
  });

  it("agrees with getValue().startsWith('=') for commented formulas", () => {
    const { editor, popupCtx } = make();

    editor.setValue('=A1+1+N("note")');
    expect(editor.isFormula()).toBe(editor.getValue().startsWith("="));

    editor.destroy();
    popupCtx.destroy();
  });
});
