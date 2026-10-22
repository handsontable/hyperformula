import { describe, expect, it } from "vitest";
import { createEditorHarness, requireTextarea, TestGridAdapter, typeInto } from "../helpers";

function createPickHarness() {
  const adapter = new TestGridAdapter({ formatRef: () => "B2" });

  return createEditorHarness({ adapter });
}

describe("FormulaEditor refActive-gated ref insertion", () => {
  it("inserts a picked ref on a standalone editor regardless of focus", () => {
    const { host, adapter, editor, destroy } = createPickHarness();

    typeInto(host, "=SUM(");
    expect(editor.isFocused()).toBe(false);

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=SUM(B2");
    destroy();
  });

  it("does not insert a picked ref before the leading = (caret at start)", () => {
    const { host, adapter, editor, destroy } = createPickHarness();
    const textarea = requireTextarea(host);

    textarea.value = "=SUM()";
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;
    textarea.dispatchEvent(new Event("input"));

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=SUM()");
    destroy();
  });

  it("replaces the selected text when a ref is picked", () => {
    const { host, adapter, editor, destroy } = createPickHarness();

    typeInto(host, "=SUM(A1)");
    requireTextarea(host).setSelectionRange(5, 7);

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=SUM(B2)");
    destroy();
  });

  it("ignores a cell pick after setRefActive(false)", () => {
    const { host, adapter, editor, destroy } = createPickHarness();

    typeInto(host, "=SUM(");
    editor.setRefActive(false);

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=SUM(");
    destroy();
  });

  it("reports ref selection inactive after setRefActive(false) even with an eligible caret", () => {
    const { host, editor, destroy } = createPickHarness();

    typeInto(host, "=SUM(");
    expect(editor.isRefSelectionActive()).toBe(true);

    editor.setRefActive(false);

    expect(editor.isRefSelectionActive()).toBe(false);
    destroy();
  });

  it("inserts a picked ref again after setRefActive(true)", () => {
    const { host, adapter, editor, destroy } = createPickHarness();

    typeInto(host, "=SUM(");
    editor.setRefActive(false);

    adapter.pickCell({ sheet: "", col: 1, row: 1 });
    expect(editor.getValue()).toBe("=SUM(");

    editor.setRefActive(true);
    expect(editor.isRefSelectionActive()).toBe(true);

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=SUM(B2");
    destroy();
  });
});
