import { describe, expect, it } from "vitest";
import { formatRef } from "../../src/adapter/refFormat";
import { paletteColorForIndex } from "../../src/theme/refPalette";
import { createEditorHarness, TestGridAdapter, typeInto } from "../helpers";

describe("header pick insertion", () => {
  it("inserts a whole-column ref at an eligible caret", () => {
    const adapter = new TestGridAdapter({ active: { sheet: "", col: 0, row: 0 } });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=");
    adapter.fireHeaderPick({ axis: "column", sheet: "", start: 0, end: 2, append: false });

    expect(editor.getValue()).toBe("=A:C");
    destroy();
  });

  it("inserts a whole-row ref at an eligible caret", () => {
    const adapter = new TestGridAdapter({ active: { sheet: "", col: 0, row: 0 } });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=");
    adapter.fireHeaderPick({ axis: "row", sheet: "", start: 3, end: 3, append: false });

    expect(editor.getValue()).toBe("=4:4");
    destroy();
  });

  it("does nothing at an ineligible caret", () => {
    const adapter = new TestGridAdapter({ active: { sheet: "", col: 0, row: 0 } });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=1");
    adapter.fireHeaderPick({ axis: "row", sheet: "", start: 1, end: 1, append: false });

    expect(editor.getValue()).toBe("=1");
    destroy();
  });
});

describe("header preview color keying", () => {
  it("keys a whole-axis preview by the whole ref, not the expanded range", () => {
    const adapter = new TestGridAdapter({
      active: { sheet: "", col: 0, row: 0 },
      formatRef,
      gridSize: { rows: 100, cols: 10 },
    });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=A1:A100+");

    const previewColor = editor.getRefPreviewColor(
      { start: { sheet: "", col: 0, row: 0 }, end: { sheet: "", col: 0, row: 99 } },
      false,
      "column",
    );

    expect(previewColor).toBe(paletteColorForIndex(1));
    destroy();
  });
});

describe("ref-selection color resolver wiring", () => {
  it("forwards the whole axis through the adapter resolver", () => {
    const adapter = new TestGridAdapter({
      active: { sheet: "", col: 0, row: 0 },
      formatRef,
      gridSize: { rows: 100, cols: 10 },
    });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    editor.enterRefSelectionMode();
    typeInto(host, "=A1:A100+");

    const resolveColor = adapter.refSelectionCalls.at(-1)?.resolveColor;
    const previewColor = resolveColor?.(
      { start: { sheet: "", col: 0, row: 0 }, end: { sheet: "", col: 0, row: 99 } },
      false,
      "column",
    );

    expect(previewColor).toBe(paletteColorForIndex(1));
    destroy();
  });
});
