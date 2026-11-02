import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormulaEditor as FormulaEditorImpl } from "../../src/formulaEditor/formulaEditor";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { makeBarAdapter, makeFormulaBar } from "../helpers";

describe("FormulaBar outside-click wiring", () => {
  let container: HTMLDivElement;
  let popupCtx: PopupContext;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    popupCtx = new PopupContext();
  });

  afterEach(() => {
    container.remove();
    popupCtx.destroy();
  });

  it("hands the editor eligibility resolver to enterRefSelectionMode on inline edit start", () => {
    const enterRefSelectionMode = vi.fn();
    const { adapter, fireInlineStart } = makeBarAdapter({ enterRefSelectionMode });
    const editor = new FormulaEditorImpl(document.createElement("div"), {
      popupCtx,
      adapter,
      onCommit: (value) => adapter.commit(value),
      onCancel: () => adapter.cancel(),
    });
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(document.createElement("div"), "=1+");

    expect(enterRefSelectionMode).toHaveBeenCalledTimes(1);

    const isPickEligible = enterRefSelectionMode.mock.calls[0]?.[1] as () => boolean;

    expect(isPickEligible()).toBe(true);

    controller.destroy();
    editor.destroy();
  });
});
