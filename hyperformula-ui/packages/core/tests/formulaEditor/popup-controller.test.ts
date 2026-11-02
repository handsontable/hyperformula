import { describe, expect, it, vi } from "vitest";
import { CN } from "../../src/theme/classNames";
import {
  blurEditor,
  createEditorHarness,
  keyUp,
  press,
  requireEditorRoot,
  requireTextarea,
  sel,
  typeInto,
} from "../helpers";

const FAKE_LANGUAGE = "popupControllerLang";

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

const FUNCTION_DETAILS: Record<string, unknown> = {
  SUM: {
    shortDescription: "Adds numbers.",
    documentationUrl: "",
    examples: ["=SUM(1,2)"],
    parameters: [
      { name: "value1", description: "First value.", optional: false },
      { name: "value2", description: "More values.", optional: true },
    ],
    repeatLastArgs: 1,
  },
  SUMIF: {
    shortDescription: "Adds matching numbers.",
    documentationUrl: "",
    examples: ['=SUMIF(A1:A5,">1")'],
    parameters: [
      { name: "range", description: "Range to test.", optional: false },
      { name: "criteria", description: "Condition.", optional: false },
    ],
    repeatLastArgs: 0,
  },
  AVERAGE: {
    shortDescription: "Averages values.",
    documentationUrl: "",
    examples: ["=AVERAGE(1,2)"],
    parameters: [{ name: "value1", description: "First value.", optional: false }],
    repeatLastArgs: 1,
  },
};

class PopupControllerHyperFormula {
  getAvailableFunctions(): unknown {
    return [
      { localizedName: "AVERAGE", canonicalName: "AVERAGE", shortDescription: "Averages values." },
      { localizedName: "SUM", canonicalName: "SUM", shortDescription: "Adds numbers." },
      {
        localizedName: "SUMIF",
        canonicalName: "SUMIF",
        shortDescription: "Adds matching numbers.",
      },
    ];
  }

  getFunctionDetails(canonicalName: string): unknown {
    return FUNCTION_DETAILS[canonicalName];
  }

  listNamedExpressions(scope?: number): string[] {
    return scope === undefined ? ["SalesRange"] : [];
  }

  getNamedExpressionFormula(): string {
    return "=A1:A10";
  }

  simpleCellRangeFromString(text: string): unknown {
    return text === "A1:A10"
      ? { start: { sheet: 0, col: 0, row: 0 }, end: { sheet: 0, col: 0, row: 9 } }
      : undefined;
  }

  simpleCellAddressFromString(): unknown {
    return undefined;
  }

  getSheetName(): string {
    return "";
  }
}

function stubEditorRootRect(host: HTMLElement, overrides: Partial<DOMRect>): void {
  const root = requireEditorRoot(host);

  root.getBoundingClientRect = () =>
    ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}), ...overrides }) as DOMRect;
}

interface PopupHarnessOptions {
  rect?: Partial<DOMRect>;
  onCommit?: (value: string) => void;
  fnHelpOptions?: { showClose?: boolean };
}

function createPopupHarness(options: PopupHarnessOptions = {}) {
  const harness = createEditorHarness({
    hyperformula: new PopupControllerHyperFormula() as never,
    language: FAKE_LANGUAGE,
    sheetId: 0,
    ...(options.onCommit !== undefined && { onCommit: options.onCommit }),
    ...(options.fnHelpOptions !== undefined && { fnHelpOptions: options.fnHelpOptions }),
  });

  stubEditorRootRect(harness.host, options.rect ?? {});

  return harness;
}

function popupRoot(className: string): HTMLElement {
  const root = document.querySelector<HTMLElement>(sel(className));

  if (!root) {
    throw new Error(`expected ${className} element in the document`);
  }

  return root;
}

function suggestionsVisible(): boolean {
  return !popupRoot(CN.suggestions).hidden;
}

function fnHelpVisible(): boolean {
  return !popupRoot(CN.fnHelp).hidden;
}

function suggestionLabels(): string[] {
  const labels = popupRoot(CN.suggestions).querySelectorAll(sel(CN.suggestionsItemLabel));

  return Array.from(labels).map((label) => (label.textContent ?? "").trim());
}

function moveCaretTo(host: HTMLElement, offset: number): void {
  requireTextarea(host).setSelectionRange(offset, offset);
  keyUp(host, "ArrowLeft");
}

function clickPopupClose(className: string): void {
  const closeButton = popupRoot(className).querySelector(sel(CN.popupClose));

  if (!closeButton) {
    throw new Error(`expected a close button inside ${className}`);
  }

  closeButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
}

describe("PopupController", () => {
  it("opens suggestions when typing a function prefix in a formula", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SU");

    expect(suggestionsVisible()).toBe(true);
    expect(suggestionLabels()).toEqual(["SUM", "SUMIF"]);
    expect(fnHelpVisible()).toBe(false);

    destroy();
  });

  it("keeps both popups closed for non-formula text", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "SU");

    expect(suggestionsVisible()).toBe(false);
    expect(fnHelpVisible()).toBe(false);

    destroy();
  });

  it("closes suggestions when the prefix no longer matches anything", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SU");
    typeInto(host, "=SUMX");

    expect(suggestionsVisible()).toBe(false);
    expect(fnHelpVisible()).toBe(false);

    destroy();
  });

  it("lists matching named expressions with their resolved range", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=Sal");

    expect(suggestionsVisible()).toBe(true);
    expect(suggestionLabels()).toEqual(["SalesRange"]);

    const suggestionsEl = popupRoot(CN.suggestions);

    expect(suggestionsEl.querySelector(sel(CN.suggestionsItemNamed))).toBeTruthy();
    expect(suggestionsEl.querySelector(sel(CN.suggestionsItemDescription))?.textContent).toBe(
      "A1:A10",
    );

    destroy();
  });

  it("shows function help for the active call and highlights the current argument", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SUM(1,");

    expect(fnHelpVisible()).toBe(true);
    expect(suggestionsVisible()).toBe(false);

    const activeArg = popupRoot(CN.fnHelp).querySelector(sel(CN.fnHelpArgActive));

    if (!activeArg) {
      throw new Error("expected an active argument in the function help signature");
    }

    expect(activeArg.textContent).toContain("value2");

    destroy();
  });

  it("prefers suggestions over function help while an argument prefix is being typed", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SUM(1");
    expect(fnHelpVisible()).toBe(true);

    typeInto(host, "=SUM(AV");
    expect(suggestionsVisible()).toBe(true);
    expect(fnHelpVisible()).toBe(false);

    typeInto(host, "=SUM(AVERAGE(1");
    expect(suggestionsVisible()).toBe(false);
    expect(fnHelpVisible()).toBe(true);
    expect(popupRoot(CN.fnHelp).querySelector(sel(CN.fnHelpName))?.textContent).toBe("AVERAGE");

    destroy();
  });

  it("closes function help when the caret leaves the call", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SUM(1");
    expect(fnHelpVisible()).toBe(true);

    moveCaretTo(host, 1);

    expect(fnHelpVisible()).toBe(false);

    destroy();
  });

  it("keeps function help closed for a call with no known signature", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=NOPE(1");

    expect(fnHelpVisible()).toBe(false);
    expect(suggestionsVisible()).toBe(false);

    destroy();
  });

  it("suppresses suggestions after Escape until the next edit", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(true);

    press(host, "Escape");
    expect(suggestionsVisible()).toBe(false);

    keyUp(host, "ArrowLeft");
    expect(suggestionsVisible()).toBe(false);

    typeInto(host, "=SUM");
    expect(suggestionsVisible()).toBe(true);

    destroy();
  });

  it("suppresses function help after its explicit close until the next edit", () => {
    const { host, destroy } = createPopupHarness({
      fnHelpOptions: { showClose: true },
    });

    typeInto(host, "=SUM(1");
    expect(fnHelpVisible()).toBe(true);

    clickPopupClose(CN.fnHelp);
    expect(fnHelpVisible()).toBe(false);

    keyUp(host, "ArrowLeft");
    expect(fnHelpVisible()).toBe(false);

    typeInto(host, "=SUM(1,");
    expect(fnHelpVisible()).toBe(true);

    destroy();
  });

  it("closes open popups when the editor loses focus", () => {
    const { host, destroy } = createPopupHarness();

    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(true);

    blurEditor(host);
    expect(suggestionsVisible()).toBe(false);

    typeInto(host, "=SUM(1");
    expect(fnHelpVisible()).toBe(true);

    blurEditor(host);
    expect(fnHelpVisible()).toBe(false);

    destroy();
  });

  it("keeps popups closed while ref insertion is inactive", () => {
    const { host, editor, destroy } = createPopupHarness();

    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(true);

    editor.setRefActive(false);
    expect(suggestionsVisible()).toBe(false);

    typeInto(host, "=SUM");
    expect(suggestionsVisible()).toBe(false);

    editor.setRefActive(true);
    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(true);

    destroy();
  });

  it("does not open popups when the input is scrolled out of view", () => {
    const { host, destroy } = createPopupHarness({
      rect: { y: -60, top: -60, bottom: -40 },
    });

    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(false);

    typeInto(host, "=SUM(1");
    expect(fnHelpVisible()).toBe(false);

    destroy();
  });

  it("ignores the editor's own overflow when finding the popup clip ancestor", () => {
    const { host, destroy } = createPopupHarness({
      rect: { y: -60, top: -60, bottom: -40 },
    });

    document.body.appendChild(host);
    requireEditorRoot(host).style.overflowY = "hidden";

    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(false);

    destroy();
    host.remove();
  });

  it("accepts a function suggestion by inserting a call with the caret inside the parens", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createPopupHarness({ onCommit });

    typeInto(host, "=SU");
    press(host, "Enter");

    expect(editor.getValue()).toBe("=SUM()");
    expect(editor.getCaretOffset()).toBe(5);
    expect(suggestionsVisible()).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();

    destroy();
  });

  it("accepts a named suggestion by inserting the name as-is", () => {
    const { host, editor, destroy } = createPopupHarness();

    typeInto(host, "=Sal");
    press(host, "Tab");

    expect(editor.getValue()).toBe("=SalesRange");
    expect(editor.getCaretOffset()).toBe(11);
    expect(suggestionsVisible()).toBe(false);

    destroy();
  });

  it("opens function help after accepting a suggestion via the real keydown+keyup Tab sequence", () => {
    const { host, editor, destroy } = createPopupHarness();

    typeInto(host, "=SU");
    press(host, "Tab");
    keyUp(host, "Tab");

    expect(editor.getValue()).toBe("=SUM()");
    expect(fnHelpVisible()).toBe(true);

    destroy();
  });

  describe("popup hosts", () => {
    const OFFSCREEN_RECT = { top: -100, bottom: -80, y: -100 };

    it("shows suggestions inside the attached host", () => {
      const { host, editor, destroy } = createPopupHarness();
      const slot = document.createElement("aside");
      document.body.appendChild(slot);

      editor.attachSuggestionsHost(slot);
      typeInto(host, "=SU");

      expect(suggestionsVisible()).toBe(true);
      expect(slot.querySelector(sel(CN.suggestions))).not.toBeNull();

      destroy();
      slot.remove();
    });

    it("keeps a host-attached suggestions popup visible when the anchor is outside the scroll clip", () => {
      const { host, editor, destroy } = createPopupHarness({ rect: OFFSCREEN_RECT });
      const slot = document.createElement("aside");
      document.body.appendChild(slot);

      editor.attachSuggestionsHost(slot);
      typeInto(host, "=SU");

      expect(suggestionsVisible()).toBe(true);

      destroy();
      slot.remove();
    });

    it("hides a floating suggestions popup when the anchor is outside the scroll clip", () => {
      const { host, destroy } = createPopupHarness({ rect: OFFSCREEN_RECT });

      typeInto(host, "=SU");

      expect(suggestionsVisible()).toBe(false);

      destroy();
    });

    it("keeps host-attached function help visible when the anchor is outside the scroll clip", () => {
      const { host, editor, destroy } = createPopupHarness({ rect: OFFSCREEN_RECT });
      const slot = document.createElement("aside");
      document.body.appendChild(slot);

      editor.attachFnHelpHost(slot);
      typeInto(host, "=SUM(");

      expect(fnHelpVisible()).toBe(true);
      expect(slot.querySelector(sel(CN.fnHelp))).not.toBeNull();

      destroy();
      slot.remove();
    });

    it("falls through to host-attached fn-help when clipped floating suggestions cannot show", () => {
      const { host, editor, destroy } = createPopupHarness({ rect: OFFSCREEN_RECT });
      const slot = document.createElement("aside");
      document.body.appendChild(slot);

      editor.attachFnHelpHost(slot);
      typeInto(host, "=SUM(SU");

      expect(suggestionsVisible()).toBe(false);
      expect(fnHelpVisible()).toBe(true);

      destroy();
      slot.remove();
    });

    it("attaches suggestions and fn-help hosts independently", () => {
      const { host, editor, destroy } = createPopupHarness({ rect: OFFSCREEN_RECT });
      const slot = document.createElement("aside");
      document.body.appendChild(slot);

      editor.attachSuggestionsHost(slot);
      typeInto(host, "=SUM(");

      expect(fnHelpVisible()).toBe(false);

      destroy();
      slot.remove();
    });

    it("detachSuggestionsHost restores floating behavior", () => {
      const { host, editor, destroy } = createPopupHarness({ rect: OFFSCREEN_RECT });
      const slot = document.createElement("aside");
      document.body.appendChild(slot);

      editor.attachSuggestionsHost(slot);
      typeInto(host, "=SU");
      editor.detachSuggestionsHost();
      typeInto(host, "=SUM");

      expect(slot.querySelector(sel(CN.suggestions))).toBeNull();
      expect(suggestionsVisible()).toBe(false);

      destroy();
      slot.remove();
    });
  });
});
