import { describe, expect, it } from "vitest";
import type { CellRange, RangeHighlight } from "../../../src/adapter/types";
import { createEditorHarness } from "../../helpers";

function startCol(items: RangeHighlight[]): number {
  return (items[0]?.range as CellRange).start.col;
}

describe("FormulaEditor silent highlight mirroring", () => {
  it("skips the grid-highlight push when silentHighlights is set", () => {
    const { adapter, editor, destroy } = createEditorHarness({ initialValue: "=A1" });

    expect(startCol(adapter.highlights)).toBe(0);

    editor.setValue("=C1", { silentHighlights: true });

    expect(editor.getValue()).toBe("=C1");
    expect(startCol(adapter.highlights)).toBe(0);

    destroy();
  });

  it("refreshes grid highlights when the editor gains focus", () => {
    const { adapter, editor, destroy } = createEditorHarness({ initialValue: "=A1" });

    editor.setValue("=C1", { silentHighlights: true });
    expect(startCol(adapter.highlights)).toBe(0);

    editor.focus();

    expect(startCol(adapter.highlights)).toBe(2);

    destroy();
  });

  it("positions the caret via the setValue caret option", () => {
    const { editor, destroy } = createEditorHarness();

    editor.setValue("=SUM(A1)", { caret: 5 });

    expect(editor.getCaretOffset()).toBe(5);

    destroy();
  });

  it("updates the caret via setCaretOffset", () => {
    const { editor, destroy } = createEditorHarness({ initialValue: "=SUM(A1)" });

    editor.setCaretOffset(5);

    expect(editor.getCaretOffset()).toBe(5);

    destroy();
  });
});
