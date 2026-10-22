import { describe, expect, it } from "vitest";
import { REF_PALETTE } from "../../src/theme/refPalette";
import { createEditorHarness, keyUp, requireTextarea, typeInto } from "../helpers";

class OwnSheetHF {
  getSheetId(sheetName: string) {
    return sheetName === "Sheet2" ? 0 : undefined;
  }
}

class OtherSheetHF {
  getSheetId() {
    return 1;
  }
}

class NamedCellHF {
  listNamedExpressions(scope?: number) {
    return scope === undefined ? ["Target"] : [];
  }

  getNamedExpressionFormula() {
    return "=B2";
  }

  simpleCellRangeFromString() {
    return undefined;
  }

  simpleCellAddressFromString() {
    return { sheet: 0, col: 1, row: 1 };
  }

  getSheetName() {
    return "";
  }
}

describe("FormulaEditor grid highlight recompute (HighlightController)", () => {
  it("pushes no grid highlights for non-formula text", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "A1+B1" });

    expect(adapter.highlights).toEqual([]);
    destroy();
  });

  it("clears grid highlights when an edit turns the text into a non-formula", () => {
    const { host, adapter, destroy } = createEditorHarness();

    typeInto(host, "=A1");
    expect(adapter.highlights).toHaveLength(1);

    typeInto(host, "A1");
    expect(adapter.highlights).toEqual([]);

    destroy();
  });

  it("assigns successive palette colors to distinct refs", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "=A1+B1" });

    expect(adapter.highlights.map((item) => item.color)).toEqual([REF_PALETTE[0], REF_PALETTE[1]]);
    destroy();
  });

  it("reuses the color of an earlier identical ref", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "=A1+B1+A1" });

    expect(adapter.highlights).toHaveLength(3);
    expect(adapter.highlights.map((item) => item.color)).toEqual([
      REF_PALETTE[0],
      REF_PALETTE[1],
      REF_PALETTE[0],
    ]);
    destroy();
  });

  it("reuses the color of an earlier ref that differs only by case", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "=A1+a1" });

    expect(adapter.highlights).toHaveLength(2);
    expect(adapter.highlights.map((item) => item.color)).toEqual([REF_PALETTE[0], REF_PALETTE[0]]);
    destroy();
  });

  it("wraps the palette after eight distinct refs", () => {
    const { adapter, destroy } = createEditorHarness({
      initialValue: "=A1+B1+C1+D1+E1+F1+G1+H1+I1",
    });

    expect(adapter.highlights).toHaveLength(9);
    expect(adapter.highlights[8]?.color).toBe(REF_PALETTE[0]);
    destroy();
  });

  it("keeps ref colors stable when a new ref is appended", () => {
    const { host, adapter, destroy } = createEditorHarness();

    typeInto(host, "=A1+B1");
    const initialColors = adapter.highlights.map((item) => item.color);

    typeInto(host, "=A1+B1+C1");

    expect(adapter.highlights.map((item) => item.color)).toEqual([
      ...initialColors,
      REF_PALETTE[2],
    ]);
    destroy();
  });

  it("fills only the ref containing the caret", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "=A1+B1" });

    expect(adapter.highlights.map((item) => item.fill)).toEqual([false, true]);
    destroy();
  });

  it("moves the fill flag when a caret move lands on another ref", () => {
    const { host, adapter, destroy } = createEditorHarness({ initialValue: "=A1+B1" });

    requireTextarea(host).setSelectionRange(2, 2);
    keyUp(host, "ArrowLeft");

    expect(adapter.highlights.map((item) => item.fill)).toEqual([true, false]);
    destroy();
  });

  it("recomputes the fill flag on refreshHighlights after a silent caret change", () => {
    const { adapter, editor, destroy } = createEditorHarness({ initialValue: "=A1+B1" });

    editor.setCaretOffset(2);
    editor.refreshHighlights();

    expect(adapter.highlights.map((item) => item.fill)).toEqual([true, false]);
    destroy();
  });

  it("skips a sheet-qualified ref when no engine can resolve the sheet", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "=Sheet2!A1" });

    expect(adapter.highlights).toEqual([]);
    destroy();
  });

  it("highlights a sheet-qualified ref that resolves to the editor's own sheet", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new OwnSheetHF() as never,
      sheetId: 0,
      initialValue: "=Sheet2!A1",
    });

    expect(adapter.highlights).toHaveLength(1);
    destroy();
  });

  it("skips a sheet-qualified ref that resolves to a different sheet", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new OtherSheetHF() as never,
      sheetId: 0,
      initialValue: "=Sheet2!A1",
    });

    expect(adapter.highlights).toEqual([]);
    destroy();
  });

  it("pushes no highlight for a whole-column ref without sheet dimensions", () => {
    const { adapter, destroy } = createEditorHarness({ initialValue: "=A:A" });

    expect(adapter.highlights).toEqual([]);
    destroy();
  });

  it("highlights the single cell a named expression resolves to", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new NamedCellHF() as never,
      sheetId: 0,
      initialValue: "=Target",
    });

    expect(adapter.highlights).toHaveLength(1);
    expect(adapter.highlights[0]?.range).toEqual({
      start: { sheet: "", col: 1, row: 1 },
      end: { sheet: "", col: 1, row: 1 },
    });
    destroy();
  });
});
