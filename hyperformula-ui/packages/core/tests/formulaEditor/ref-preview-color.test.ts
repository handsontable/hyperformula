import { describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import { REF_PALETTE } from "../../src/theme/refPalette";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { TestGridAdapter, typeInto } from "../helpers";

function a1(col: number, row: number): string {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

function makeAdapter(): TestGridAdapter {
  return new TestGridAdapter({
    formatRef: (ref) => ("start" in ref ? a1(ref.start.col, ref.start.row) : a1(ref.col, ref.row)),
  });
}

describe("FormulaEditor ref preview color", () => {
  it("getRefPreviewColor returns the first palette color for an empty formula", () => {
    const adapter = makeAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();

    const previewColor = editor.getRefPreviewColor({
      start: { sheet: "", col: 2, row: 2 },
      end: { sheet: "", col: 2, row: 2 },
    });

    expect(previewColor).toBe(REF_PALETTE[0]);

    editor.destroy();
  });

  it("getRefPreviewColor matches the color a newly-inserted ref would get", () => {
    const adapter = makeAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();
    typeInto(host, "=A1+");

    const previewColor = editor.getRefPreviewColor({
      start: { sheet: "", col: 2, row: 2 },
      end: { sheet: "", col: 2, row: 2 },
    });

    expect(previewColor).toBe(REF_PALETTE[1]);

    editor.destroy();
  });

  it("getRefPreviewColor reuses the existing index for an already-referenced cell", () => {
    const adapter = makeAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();
    typeInto(host, "=A1+");

    const previewColor = editor.getRefPreviewColor({
      start: { sheet: "", col: 0, row: 0 },
      end: { sheet: "", col: 0, row: 0 },
    });

    expect(previewColor).toBe(REF_PALETTE[0]);

    editor.destroy();
  });

  it("collapses a single-cell range to the committed A1 form under the real formatRef", () => {
    const adapter = new NullAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();
    typeInto(host, "=A1+");

    const previewColor = editor.getRefPreviewColor({
      start: { sheet: "", col: 0, row: 0 },
      end: { sheet: "", col: 0, row: 0 },
    });

    expect(previewColor).toBe(REF_PALETTE[0]);

    editor.destroy();
  });

  it("does not count the pending ref about to be replaced when previewing its replacement", () => {
    const adapter = makeAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();
    typeInto(host, "=SUM(");
    adapter.pickCell({ sheet: "", col: 0, row: 0 });
    expect(editor.getValue()).toBe("=SUM(A1");

    const previewColor = editor.getRefPreviewColor({
      start: { sheet: "", col: 2, row: 2 },
      end: { sheet: "", col: 2, row: 2 },
    });

    expect(previewColor).toBe(REF_PALETTE[0]);

    editor.destroy();
  });

  it("previews the pending ref's own palette slot, not the next-new-ref color, when replacing it", () => {
    const adapter = makeAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();
    editor.setValue("=(D1-C1)*", { caret: "=(D1-C1)*".length });

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=(D1-C1)*B2");

    const pendingRange = {
      start: { sheet: "", col: 1, row: 1 },
      end: { sheet: "", col: 1, row: 1 },
    };
    const replacementRange = {
      start: { sheet: "", col: 4, row: 4 },
      end: { sheet: "", col: 4, row: 4 },
    };

    expect(editor.getRefPreviewColor(pendingRange)).toBe(REF_PALETTE[2]);
    expect(editor.getRefPreviewColor(replacementRange)).toBe(REF_PALETTE[2]);

    editor.destroy();
  });

  it("previews the next-new-ref color, not the pending ref's slot, when appending alongside it", () => {
    const adapter = makeAdapter();
    const host = document.createElement("div");
    const editor = new FormulaEditor(host, { adapter, popupCtx: new PopupContext() });

    editor.focus();
    editor.setValue("=(D1-C1)*", { caret: "=(D1-C1)*".length });

    adapter.pickCell({ sheet: "", col: 1, row: 1 });

    expect(editor.getValue()).toBe("=(D1-C1)*B2");

    const appendRange = {
      start: { sheet: "", col: 4, row: 4 },
      end: { sheet: "", col: 4, row: 4 },
    };

    expect(editor.getRefPreviewColor(appendRange, true)).toBe(REF_PALETTE[3]);

    editor.destroy();
  });
});
