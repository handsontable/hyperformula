import { describe, expect, it } from "vitest";
import { createEditorHarness } from "../../helpers";

class DimHF {
  getSheetDimensions(_sheetId: number) {
    return { width: 10, height: 20 };
  }

  getSheetId(_name: string) {
    return 0;
  }
}

describe("FormulaEditor whole-range highlights", () => {
  it("sets whole=column on items for an A:A reference", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new DimHF() as never,
      sheetId: 0,
      initialValue: "=A:A",
    });

    expect(adapter.highlights).toHaveLength(1);
    expect(adapter.highlights[0]?.whole).toBe("column");
    expect(adapter.highlights[0]?.range.start.col).toBe(0);
    expect(adapter.highlights[0]?.range.end.col).toBe(0);

    destroy();
  });

  it("sets whole=row on items for a 1:1 reference", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new DimHF() as never,
      sheetId: 0,
      initialValue: "=1:1",
    });

    expect(adapter.highlights).toHaveLength(1);
    expect(adapter.highlights[0]?.whole).toBe("row");
    expect(adapter.highlights[0]?.range.start.row).toBe(0);
    expect(adapter.highlights[0]?.range.end.row).toBe(0);

    destroy();
  });

  it("does not set whole for a normal cell range reference", () => {
    const { adapter, destroy } = createEditorHarness({
      hyperformula: new DimHF() as never,
      sheetId: 0,
      initialValue: "=A1:B2",
    });

    expect(adapter.highlights).toHaveLength(1);
    expect(adapter.highlights[0]?.whole).toBeUndefined();

    destroy();
  });
});
