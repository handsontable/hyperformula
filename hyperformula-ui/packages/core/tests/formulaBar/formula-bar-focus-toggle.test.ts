import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IGridAdapter } from "../../src/adapter/types";
import { FormulaEditor as FormulaEditorImpl } from "../../src/formulaEditor/formulaEditor";
import { CN } from "../../src/theme/classNames";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { makeBarAdapter, makeFormulaBar, sel } from "../helpers";

const FAKE_LANGUAGE = "fnHelpToggleLang";

const VISIBLE_INPUT_RECT = {
  x: 10,
  y: 10,
  left: 10,
  top: 10,
  right: 130,
  bottom: 30,
  width: 120,
  height: 20,
};

function makeToggleHyperFormula(documentationUrl = "https://example.com/sum") {
  class ToggleHyperFormula {
    getAvailableFunctions(): unknown {
      return [{ localizedName: "SUM", canonicalName: "SUM", shortDescription: "Adds numbers." }];
    }

    getFunctionDetails(): unknown {
      return {
        shortDescription: "Adds numbers.",
        documentationUrl,
        examples: ["=SUM(1,2)"],
        parameters: [{ name: "value1", description: "First value.", optional: false }],
        repeatLastArgs: 1,
      };
    }

    listNamedExpressions(): string[] {
      return [];
    }

    getNamedExpressionFormula(): string {
      return "";
    }

    simpleCellRangeFromString(): unknown {
      return undefined;
    }

    simpleCellAddressFromString(): unknown {
      return undefined;
    }

    getSheetName(): string {
      return "";
    }
  }

  return ToggleHyperFormula;
}

let sharedPopupCtx: PopupContext;

beforeEach(() => {
  sharedPopupCtx = new PopupContext();
});

afterEach(() => {
  sharedPopupCtx.destroy();
  document.body.innerHTML = "";
});

function makeEditor(
  adapter: IGridAdapter,
  withEngine = false,
  options: { documentationUrl?: string; showClose?: boolean } = {},
): FormulaEditorImpl {
  return new FormulaEditorImpl(document.createElement("div"), {
    popupCtx: sharedPopupCtx,
    adapter,
    onCommit: (value) => adapter.commit(value),
    onCancel: () => adapter.cancel(),
    ...(options.showClose !== undefined && { fnHelpOptions: { showClose: options.showClose } }),
    ...(withEngine && {
      hyperformula: new (makeToggleHyperFormula(options.documentationUrl))() as never,
      language: FAKE_LANGUAGE,
      sheetId: 0,
    }),
  });
}

function editorTextarea(scope: HTMLElement): HTMLTextAreaElement {
  const textarea = scope.querySelector("textarea");

  if (!textarea) {
    throw new Error("expected the editor textarea inside the scope");
  }

  return textarea;
}

function overlayEl(container: HTMLElement): HTMLElement {
  return container.querySelector(".hfe-formula-bar__overlay") as HTMLElement;
}

function pressKey(target: Element, key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });

  target.dispatchEvent(event);

  return event;
}

function makeToggleHarness(
  withEngine = false,
  editorOptions: { documentationUrl?: string; showClose?: boolean } = {},
) {
  const container = document.createElement("div");
  const inlineMount = document.createElement("div");

  document.body.append(container, inlineMount);

  const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
    getActiveCell: () => ({ sheet: "", col: 0, row: 0 }),
    getCellFormula: () => "",
  });
  const editor = makeEditor(adapter, withEngine, editorOptions);
  const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

  return { container, inlineMount, editor, controller, fireInlineStart, fireInlineClose };
}

describe("FormulaBar F6 host toggle", () => {
  it("F6 during an inline edit reparents the editor into the bar", () => {
    const { container, inlineMount, editor, controller, fireInlineStart } = makeToggleHarness();

    fireInlineStart(inlineMount, "=1+1");
    pressKey(editorTextarea(inlineMount), "F6");

    expect(editorTextarea(container)).toBeTruthy();
    expect(overlayEl(container).hidden).toBe(false);

    controller.destroy();
    editor.destroy();
  });

  it("F6 from the bar-hosted editor reparents back to the inline mount", () => {
    const { container, inlineMount, editor, controller, fireInlineStart } = makeToggleHarness();

    fireInlineStart(inlineMount, "=1+1");
    pressKey(editorTextarea(inlineMount), "F6");
    pressKey(editorTextarea(container), "F6");

    expect(editorTextarea(inlineMount)).toBeTruthy();
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("Shift+F6 toggles the same way as F6", () => {
    const { container, inlineMount, editor, controller, fireInlineStart } = makeToggleHarness();

    fireInlineStart(inlineMount, "=1+1");
    pressKey(editorTextarea(inlineMount), "F6", true);

    expect(editorTextarea(container)).toBeTruthy();

    pressKey(editorTextarea(container), "F6", true);

    expect(editorTextarea(inlineMount)).toBeTruthy();
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("F6 prefers the popup over the host toggle while the popup is open", () => {
    const { container, inlineMount, editor, controller, fireInlineStart } = makeToggleHarness(true);

    fireInlineStart(inlineMount, "");
    const textarea = editorTextarea(inlineMount);
    const editorRoot = inlineMount.querySelector(sel(CN.editor)) as HTMLElement;

    editorRoot.getBoundingClientRect = () =>
      ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;
    textarea.value = "=SUM(1";
    textarea.setSelectionRange(6, 6);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
    pressKey(textarea, "F6");

    const popup = sharedPopupCtx.portal.querySelector<HTMLElement>(sel(CN.fnHelp));

    expect(popup?.hidden).toBe(false);
    expect(popup?.contains(document.activeElement)).toBe(true);
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("F6 focuses the popup body instead of toggling the host when the popup has no interactive elements", () => {
    const { container, inlineMount, editor, controller, fireInlineStart } = makeToggleHarness(
      true,
      {
        documentationUrl: "",
        showClose: false,
      },
    );

    fireInlineStart(inlineMount, "");
    const textarea = editorTextarea(inlineMount);
    const editorRoot = inlineMount.querySelector(sel(CN.editor)) as HTMLElement;

    editorRoot.getBoundingClientRect = () =>
      ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;
    textarea.value = "=SUM(1";
    textarea.setSelectionRange(6, 6);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
    pressKey(textarea, "F6");

    const popup = sharedPopupCtx.portal.querySelector<HTMLElement>(sel(CN.fnHelp));

    expect(popup?.hidden).toBe(false);
    expect(popup?.contains(document.activeElement)).toBe(true);
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("F6 is inert outside an edit session", () => {
    const { container, editor, controller } = makeToggleHarness();
    const event = pressKey(editorTextarea(container), "F6");

    expect(event.defaultPrevented).toBe(false);
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("F6 is inert again after the edit session closes", () => {
    const { container, inlineMount, editor, controller, fireInlineStart, fireInlineClose } =
      makeToggleHarness();

    fireInlineStart(inlineMount, "=1+1");
    fireInlineClose();
    const event = pressKey(editorTextarea(container), "F6");

    expect(event.defaultPrevented).toBe(false);
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("F6 does nothing after the bar is destroyed", () => {
    const { inlineMount, editor, controller, fireInlineStart } = makeToggleHarness();

    fireInlineStart(inlineMount, "=1+1");
    controller.destroy();
    const event = pressKey(editorTextarea(inlineMount), "F6");

    expect(event.defaultPrevented).toBe(false);
    expect(editorTextarea(inlineMount)).toBeTruthy();

    editor.destroy();
  });
});
