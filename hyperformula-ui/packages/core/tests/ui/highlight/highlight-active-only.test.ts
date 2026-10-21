import { describe, expect, it } from "vitest";
import {
  blurEditor,
  createEditorHarness,
  focusEditor,
  keyUp,
  press,
  typeInto,
} from "../../helpers";

describe("FormulaEditor highlights track the active editor", () => {
  it("clears grid highlights when the editor blurs and no ref is being selected", () => {
    const { host, adapter, editor, destroy } = createEditorHarness({ initialValue: "=A1" });

    editor.focus();
    expect(adapter.highlights.length).toBe(1);

    blurEditor(host);
    expect(adapter.highlights).toEqual([]);

    destroy();
  });

  it("keeps grid highlights on blur while a ref is being selected", () => {
    const { host, adapter, editor, destroy } = createEditorHarness();

    editor.focus();
    typeInto(host, "=A1+");
    expect(adapter.highlights.length).toBe(1);

    blurEditor(host);
    expect(adapter.highlights.length).toBe(1);

    destroy();
  });

  it("clears grid highlights when the formula is committed with Enter", () => {
    const { host, adapter, editor, destroy } = createEditorHarness({ onCommit: () => {} });

    editor.focus();
    typeInto(host, "=A1+B1");
    expect(adapter.highlights.length).toBe(2);

    press(host, "Enter");
    expect(adapter.highlights).toEqual([]);

    destroy();
  });

  it("stays cleared after commit despite a trailing caret move from the key release", () => {
    const { host, adapter, editor, destroy } = createEditorHarness({ onCommit: () => {} });

    editor.focus();
    typeInto(host, "=A1+B1");
    expect(adapter.highlights.length).toBe(2);

    press(host, "Enter");
    keyUp(host);
    expect(adapter.highlights).toEqual([]);

    destroy();
  });

  it("stays cleared when an already-focused editor is reparented after a commit", () => {
    const { host, adapter, editor, destroy } = createEditorHarness({ onCommit: () => {} });

    editor.focus();
    typeInto(host, "=A1+B1");
    expect(adapter.highlights.length).toBe(2);

    press(host, "Enter");
    expect(adapter.highlights).toEqual([]);

    editor.attachTo(document.createElement("div"));
    expect(adapter.highlights).toEqual([]);

    destroy();
  });

  it("restores grid highlights when a genuine focus gain reopens editing", () => {
    const { host, adapter, editor, destroy } = createEditorHarness({ onCommit: () => {} });

    editor.focus();
    typeInto(host, "=A1+B1");
    press(host, "Enter");
    expect(adapter.highlights).toEqual([]);

    blurEditor(host);
    focusEditor(host);
    expect(adapter.highlights.length).toBe(2);

    destroy();
  });

  it("clears grid highlights when editing is cancelled with Escape", () => {
    const { host, adapter, editor, destroy } = createEditorHarness({ onCancel: () => {} });

    editor.focus();
    typeInto(host, "=A1+B1");
    expect(adapter.highlights.length).toBe(2);

    press(host, "Escape");
    expect(adapter.highlights).toEqual([]);

    destroy();
  });
});
