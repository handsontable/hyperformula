import { describe, expect, it, vi } from "vitest";
import { createEditorHarness, formatRefAsRC, press, TestGridAdapter, typeInto } from "../helpers";

const FIRST_CELL = { sheet: "", col: 0, row: 0 };
const SECOND_CELL = { sheet: "", col: 2, row: 1 };
const SAMPLE_RANGE = {
  start: { sheet: "", col: 0, row: 0 },
  end: { sheet: "", col: 1, row: 2 },
};

function createRefHarness() {
  const adapter = new TestGridAdapter({ formatRef: formatRefAsRC });

  return createEditorHarness({ adapter });
}

describe("FormulaEditor pending-ref lifecycle (RefController)", () => {
  it("replaces the pending picked ref when another cell is picked", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    expect(editor.getValue()).toBe("=SUM(R0C0");

    adapter.pickCell(SECOND_CELL);
    expect(editor.getValue()).toBe("=SUM(R1C2");

    destroy();
  });

  it("inserts a formatted range ref when a range is picked", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickRange(SAMPLE_RANGE);

    expect(editor.getValue()).toBe("=SUM(R0C0:R2C1");
    destroy();
  });

  it("extends the pending cell ref into a range on a subsequent range pick", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    adapter.pickRange(SAMPLE_RANGE);

    expect(editor.getValue()).toBe("=SUM(R0C0:R2C1");
    destroy();
  });

  it("appends the next pick instead of replacing once typing resets the pending ref", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    typeInto(host, "=SUM(R0C0+");

    adapter.pickCell(SECOND_CELL);

    expect(editor.getValue()).toBe("=SUM(R0C0+R1C2");
    destroy();
  });

  it("ignores picks while the text is not a formula", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "SUM(");
    adapter.pickCell(FIRST_CELL);

    expect(editor.getValue()).toBe("SUM(");
    destroy();
  });

  it("ignores picks when the character before the caret is not a ref opener", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(A1");
    adapter.pickCell(FIRST_CELL);

    expect(editor.getValue()).toBe("=SUM(A1");
    destroy();
  });

  it("skips trailing whitespace when locating the ref opener", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(  ");
    adapter.pickCell(FIRST_CELL);

    expect(editor.getValue()).toBe("=SUM(  R0C0");
    destroy();
  });

  it("inserts a picked ref after an arithmetic operator", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=1+");
    adapter.pickCell(FIRST_CELL);

    expect(editor.getValue()).toBe("=1+R0C0");
    destroy();
  });

  it("stops replacing the pending ref after the caret moves away", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    editor.setCaretOffset(4);

    adapter.pickCell(SECOND_CELL);

    expect(editor.getValue()).toBe("=SUM(R0C0");
    destroy();
  });

  it("reports ref selection active for a pending ref even when no opener precedes the caret", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    expect(editor.canInsertRef()).toBe(true);

    adapter.pickCell(FIRST_CELL);

    expect(editor.canInsertRef()).toBe(false);
    expect(editor.isRefSelectionActive()).toBe(true);
    destroy();
  });

  it("keeps the point-inserted ref when Escape follows a caret move away from it", () => {
    const onCancel = vi.fn();
    const adapter = new TestGridAdapter({
      formatRef: formatRefAsRC,
      active: { sheet: "", col: 0, row: 0 },
    });
    const { host, editor, destroy } = createEditorHarness({ adapter, onCancel });

    typeInto(host, "=");
    press(host, "ArrowRight");
    expect(editor.getValue()).toBe("=R0C1");

    editor.setCaretOffset(1);
    press(host, "Escape");

    expect(editor.getValue()).toBe("=R0C1");
    expect(onCancel).not.toHaveBeenCalled();
    destroy();
  });

  it("appends a mod+click pick after the previous ref instead of replacing it", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    adapter.pickCell(SECOND_CELL, true);

    expect(editor.getValue()).toBe("=SUM(R0C0,R1C2");
    destroy();
  });

  it("chains a second mod+click after the just-appended ref, not the original one", () => {
    const { host, adapter, editor, destroy } = createRefHarness();
    const thirdCell = { sheet: "", col: 3, row: 3 };

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    adapter.pickCell(SECOND_CELL, true);
    adapter.pickCell(thirdCell, true);

    expect(editor.getValue()).toBe("=SUM(R0C0,R1C2,R3C3");
    destroy();
  });

  it("replaces only the just-appended ref when a plain click follows a mod+click", () => {
    const { host, adapter, editor, destroy } = createRefHarness();
    const thirdCell = { sheet: "", col: 3, row: 3 };

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    adapter.pickCell(SECOND_CELL, true);
    adapter.pickCell(thirdCell);

    expect(editor.getValue()).toBe("=SUM(R0C0,R3C3");
    destroy();
  });

  it("treats a mod+click with no prior ref as a plain fresh insert", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL, true);

    expect(editor.getValue()).toBe("=SUM(R0C0");
    destroy();
  });

  it("falls back to fresh-insert gating when a mod+click follows an edited-away ref", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    typeInto(host, "=SUM(A9+");
    adapter.pickCell(SECOND_CELL, true);

    expect(editor.getValue()).toBe("=SUM(A9+R1C2");
    destroy();
  });

  it("does not append after setValue re-seeds the editor with identical text", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    editor.setValue("=SUM(R0C0");
    adapter.pickCell(SECOND_CELL, true);

    expect(editor.getValue()).toBe("=SUM(R0C0");
    destroy();
  });

  it("does not append when the caret has moved away from the last ref", () => {
    const { host, adapter, editor, destroy } = createRefHarness();

    typeInto(host, "=SUM(");
    adapter.pickCell(FIRST_CELL);
    editor.setCaretOffset(3);
    adapter.pickCell(SECOND_CELL, true);

    expect(editor.getValue()).toBe("=SUM(R0C0");
    destroy();
  });
});
