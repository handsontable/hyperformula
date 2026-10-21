import { describe, expect, it } from "vitest";
import { CN } from "../../src/theme/classNames";
import { createEditorHarness, sel } from "../helpers";

describe("FormulaEditor formula class toggle", () => {
  it("toggles the formula class with isFormula state", () => {
    const { host, editor, destroy } = createEditorHarness();
    const root = host.querySelector(sel(CN.editor));
    if (!root) {
      throw new Error("expected editor root element");
    }

    editor.setValue("123");
    expect(root.classList.contains(CN.editorFormula)).toBe(false);

    editor.setValue("=SUM(1)");
    expect(root.classList.contains(CN.editorFormula)).toBe(true);

    destroy();
  });

  it("drops the formula class when the leading = is deleted", () => {
    const { host, editor, destroy } = createEditorHarness();
    const root = host.querySelector(sel(CN.editor));
    if (!root) {
      throw new Error("expected editor root element");
    }

    editor.setValue("=SUM(1)");
    expect(root.classList.contains(CN.editorFormula)).toBe(true);

    editor.setValue("SUM(1)");
    expect(root.classList.contains(CN.editorFormula)).toBe(false);

    destroy();
  });
});
