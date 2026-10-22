import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FormulaEditor as FormulaEditorImpl } from "../../src/formulaEditor/formulaEditor";
import { CN } from "../../src/theme/classNames";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { makeBarAdapter, makeFormulaBar, sel } from "../helpers";

describe("FormulaBar portal wiring", () => {
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
    for (const el of document.body.querySelectorAll(sel(CN.suggestions))) {
      el.remove();
    }
  });

  it("mounts suggestions inside the portal returned by the editor's popupCtx", () => {
    const { adapter } = makeBarAdapter();
    const editor = new FormulaEditorImpl(document.createElement("div"), {
      popupCtx,
      adapter,
      onCommit: (value) => adapter.commit(value),
      onCancel: () => adapter.cancel(),
    });
    const ctrl = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
    (ctrl as any).editor.suggestions.show([{ value: "SUM" }], {
      left: 0,
      top: 0,
      height: 20,
      width: 100,
    });
    expect(popupCtx.portal.querySelector(sel(CN.suggestions))).toBeTruthy();
    ctrl.destroy();
    editor.destroy();
  });
});
