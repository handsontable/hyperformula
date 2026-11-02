import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import type { FormulaEditorOptions } from "../../src/formulaEditor/types";
import { CN } from "../../src/theme/classNames";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { sel } from "../helpers";

class SuggestingHF {
  getRegisteredFunctionNames() {
    return ["SALESFORECAST"];
  }
  getConfig() {
    return { language: "suggestingHFTest" };
  }
  listNamedExpressions(scope?: number) {
    return scope === undefined ? ["SalesRange"] : [];
  }
  getNamedExpressionFormula() {
    return "=A1:A10";
  }
  simpleCellRangeFromString() {
    return { start: { sheet: 0, col: 0, row: 0 }, end: { sheet: 0, col: 0, row: 9 } };
  }
  simpleCellAddressFromString() {
    return undefined;
  }
  getSheetName() {
    return "";
  }
}

const VISIBLE_RECT = {
  left: 10,
  top: 10,
  right: 110,
  bottom: 30,
  width: 100,
  height: 20,
  x: 10,
  y: 10,
  toJSON: () => ({}),
} as DOMRect;

describe("FormulaEditor suggestionsOptions option", () => {
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

  it("forwards showClose: true to SuggestionsPopup", () => {
    const editor = new FormulaEditor(container, {
      popupCtx,
      adapter: new NullAdapter(),
      suggestionsOptions: { showClose: true },
    });
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
    (editor as any).suggestions.show([{ value: "SUM" }], {
      left: 0,
      top: 0,
      height: 20,
      width: 100,
    });
    expect(document.body.querySelector(sel(CN.popupClose))).toBeTruthy();
    editor.destroy();
  });

  it("mounts suggestions and fn-help inside the provided popupContext portal", () => {
    const editor = new FormulaEditor(container, { popupCtx, adapter: new NullAdapter() });
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
    (editor as any).suggestions.show([{ value: "SUM" }], {
      left: 0,
      top: 0,
      height: 20,
      width: 100,
    });
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
    (editor as any).fnHelp.show({ name: "SUM", params: [], repeatLast: 0 }, 0, {
      left: 0,
      top: 0,
      height: 20,
      width: 100,
    });
    expect(popupCtx.portal.querySelector(sel(CN.suggestions))).toBeTruthy();
    expect(popupCtx.portal.querySelector(sel(CN.fnHelp))).toBeTruthy();
    editor.destroy();
  });

  it("forwards fnHelpOptions.showClose: false to FunctionHelpPopup", () => {
    const editor = new FormulaEditor(container, {
      popupCtx,
      adapter: new NullAdapter(),
      fnHelpOptions: { showClose: false },
    });
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
    (editor as any).fnHelp.show({ name: "SUM", params: [], repeatLast: 0 }, 0, {
      left: 0,
      top: 0,
      height: 20,
      width: 100,
    });
    expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();
    editor.destroy();
  });

  function openSalSuggestions(
    container: HTMLDivElement,
    popupCtx: PopupContext,
    suggestionsOptions?: FormulaEditorOptions["suggestionsOptions"],
  ): FormulaEditor {
    const editor = new FormulaEditor(container, {
      popupCtx,
      adapter: new NullAdapter(),
      hyperformula: new SuggestingHF() as never,
      sheetId: 0,
      ...(suggestionsOptions !== undefined && { suggestionsOptions }),
    });
    const root = container.querySelector<HTMLElement>(sel(CN.editor));

    if (!root) {
      throw new Error("expected editor root element");
    }

    root.getBoundingClientRect = () => VISIBLE_RECT;
    editor.setValue("=Sal");
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field to drive the popup
    (editor as any).input.setCaret(4);
    // biome-ignore lint/suspicious/noExplicitAny: accessing private field to drive the popup
    (editor as any).popupCtrl.maybeShowPopup();

    return editor;
  }

  it("includes named expressions in the suggestions popup by default", () => {
    const editor = openSalSuggestions(container, popupCtx);
    const popup = popupCtx.portal.querySelector(sel(CN.suggestions));

    expect(popup?.querySelector(sel(CN.suggestionsItemNamed))).toBeTruthy();
    expect(popup?.textContent).toContain("SalesRange");
    editor.destroy();
  });

  it("excludes named expressions when showNamedExpressions is false", () => {
    const editor = openSalSuggestions(container, popupCtx, { showNamedExpressions: false });
    const popup = popupCtx.portal.querySelector(sel(CN.suggestions));

    expect(popup?.querySelector(sel(CN.suggestionsItemNamed))).toBeNull();
    expect(popup?.textContent ?? "").not.toContain("SalesRange");
    editor.destroy();
  });

  it("keeps function suggestions when showNamedExpressions is false", () => {
    const editor = openSalSuggestions(container, popupCtx, { showNamedExpressions: false });
    const popup = popupCtx.portal.querySelector(sel(CN.suggestions));

    expect(popup?.textContent).toContain("SALESFORECAST");
    editor.destroy();
  });
});
