import { describe, expect, it } from "vitest";
import { CN } from "../../src/theme/classNames";
import type { PopupContext } from "../../src/ui/popup/popupContext";
import {
  createEditorHarness,
  keyUp,
  press,
  requireEditorRoot,
  requireTextarea,
  sel,
  typeInto,
} from "../helpers";

const FAKE_LANGUAGE = "editorAriaLang";

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
};

class EditorAriaHyperFormula {
  getAvailableFunctions(): unknown {
    return [
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

function createAriaHarness() {
  const harness = createEditorHarness({
    hyperformula: new EditorAriaHyperFormula() as never,
    language: FAKE_LANGUAGE,
    sheetId: 0,
  });
  const textarea = requireTextarea(harness.host);
  const root = requireEditorRoot(harness.host);

  root.getBoundingClientRect = () => ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;

  return { ...harness, textarea };
}

function popupRoot(popupCtx: PopupContext, className: string): HTMLElement {
  const root = popupCtx.portal.querySelector<HTMLElement>(sel(className));

  if (!root) {
    throw new Error(`expected ${className} element in the popup portal`);
  }

  return root;
}

describe("FormulaEditor ARIA wiring", () => {
  it("exposes static autocomplete attributes and an id on the textarea", () => {
    const { textarea, destroy } = createAriaHarness();

    expect(textarea.id).not.toBe("");
    expect(textarea.getAttribute("aria-autocomplete")).toBe("list");

    destroy();
  });

  it("wires aria-controls and aria-activedescendant while suggestions are open", () => {
    const { host, popupCtx, textarea, destroy } = createAriaHarness();

    typeInto(host, "=SU");

    const popupRoot = popupCtx.portal.querySelector<HTMLElement>(sel(CN.suggestions));

    if (!popupRoot) {
      throw new Error(`expected ${CN.suggestions} element in the popup portal`);
    }

    const listbox = popupRoot.querySelector<HTMLElement>('[role="listbox"]');

    if (!listbox) {
      throw new Error("expected listbox element");
    }

    expect(listbox.id).not.toBe("");
    expect(textarea.getAttribute("aria-controls")).toBe(listbox.id);
    expect(textarea.getAttribute("aria-expanded")).toBe("true");

    const options = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
    const firstOption = options[0];

    if (!firstOption) {
      throw new Error("expected at least one suggestion option");
    }

    expect(firstOption.id).not.toBe("");
    expect(textarea.getAttribute("aria-activedescendant")).toBe(firstOption.id);

    destroy();
  });

  it("moves aria-activedescendant with keyboard navigation", () => {
    const { host, popupCtx, textarea, destroy } = createAriaHarness();

    typeInto(host, "=SU");
    press(host, "ArrowDown");

    const popupRootEl = popupRoot(popupCtx, CN.suggestions);
    const listbox = popupRootEl.querySelector<HTMLElement>('[role="listbox"]');

    if (!listbox) {
      throw new Error("expected listbox element");
    }

    const options = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
    const secondOption = options[1];

    if (!secondOption) {
      throw new Error("expected a second suggestion option");
    }

    expect(secondOption.getAttribute("aria-selected")).toBe("true");
    expect(textarea.getAttribute("aria-activedescendant")).toBe(secondOption.id);

    destroy();
  });

  it("resets listbox linking when suggestions close", () => {
    const { host, textarea, destroy } = createAriaHarness();

    typeInto(host, "=SU");
    press(host, "Escape");

    expect(textarea.getAttribute("aria-controls")).toBeNull();
    expect(textarea.getAttribute("aria-activedescendant")).toBeNull();
    expect(textarea.getAttribute("aria-expanded")).toBe("false");

    destroy();
  });

  it("describes the textarea via the function help popup while it is visible", () => {
    const { host, popupCtx, textarea, destroy } = createAriaHarness();

    typeInto(host, "=SUM(1");

    const fnHelpEl = popupRoot(popupCtx, CN.fnHelp);

    expect(fnHelpEl.id).not.toBe("");
    expect(textarea.getAttribute("aria-describedby")).toBe(fnHelpEl.id);

    requireTextarea(host).setSelectionRange(1, 1);
    keyUp(host, "ArrowLeft");

    expect(textarea.getAttribute("aria-describedby")).toBeNull();

    destroy();
  });
});
