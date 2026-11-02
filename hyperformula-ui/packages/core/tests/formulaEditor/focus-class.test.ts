import { describe, expect, it } from "vitest";
import { CN } from "../../src/theme/classNames";
import { blurEditor, createEditorHarness, focusEditor, sel } from "../helpers";

describe("FormulaEditor focused class", () => {
  it("toggles the focused class on the root element across focus and blur", () => {
    const { host, destroy } = createEditorHarness();
    const root = host.querySelector(sel(CN.editor));
    if (!root) {
      throw new Error("expected editor root element");
    }

    focusEditor(host);
    expect(root.classList.contains(CN.editorFocused)).toBe(true);

    blurEditor(host);
    expect(root.classList.contains(CN.editorFocused)).toBe(false);

    destroy();
  });
});
