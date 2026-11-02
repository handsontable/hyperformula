import { describe, expect, it, vi } from "vitest";
import { CN } from "../../src/theme/classNames";
import {
  createEditorHarness,
  keyUp,
  requireEditorRoot,
  requireTextarea,
  sel,
  typeInto,
} from "../helpers";

const FAKE_LANGUAGE = "popupControllerCacheLang";

const ROOT_RECT = {
  x: 10,
  y: 60,
  left: 10,
  top: 60,
  right: 130,
  bottom: 80,
  width: 120,
  height: 20,
};

class PopupCacheHyperFormula {
  getAvailableFunctions(): unknown {
    return [{ localizedName: "SUM", canonicalName: "SUM", shortDescription: "Adds numbers." }];
  }

  getFunctionDetails(canonicalName: string): unknown {
    return canonicalName === "SUM"
      ? {
          shortDescription: "Adds numbers.",
          documentationUrl: "",
          examples: ["=SUM(1,2)"],
          parameters: [{ name: "value1", description: "First value.", optional: false }],
          repeatLastArgs: 1,
        }
      : undefined;
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

function stubRect(element: HTMLElement, rect: Partial<DOMRect>): void {
  element.getBoundingClientRect = () => ({ ...ROOT_RECT, toJSON: () => ({}), ...rect }) as DOMRect;
}

function makeClipAncestor(rect: Partial<DOMRect>): HTMLDivElement {
  const clip = document.createElement("div");

  clip.style.overflowY = "hidden";
  stubRect(clip, rect);

  return clip;
}

function suggestionsVisible(): boolean {
  const root = document.querySelector<HTMLElement>(sel(CN.suggestions));

  return !!root && !root.hidden;
}

function fnHelpVisible(): boolean {
  const root = document.querySelector<HTMLElement>(sel(CN.fnHelp));

  return !!root && !root.hidden;
}

function clickPopupClose(className: string): void {
  const root = document.querySelector<HTMLElement>(sel(className));
  const closeButton = root?.querySelector(sel(CN.popupClose));

  if (!closeButton) {
    throw new Error(`expected a close button inside ${className}`);
  }

  closeButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
}

function moveCaretTo(host: HTMLElement, offset: number): void {
  requireTextarea(host).setSelectionRange(offset, offset);
  keyUp(host, "ArrowLeft");
}

describe("PopupController scroll-clip ancestor cache", () => {
  it("re-resolves the scroll-clip ancestor after the editor reparents into a different scroll container", () => {
    const harness = createEditorHarness({
      hyperformula: new PopupCacheHyperFormula() as never,
      language: FAKE_LANGUAGE,
      sheetId: 0,
    });
    const { host, editor, destroy } = harness;

    const visibleClip = makeClipAncestor({ top: 0, bottom: 1000, left: 0, right: 1000 });
    const clippingClip = makeClipAncestor({ top: 0, bottom: 40, left: 0, right: 1000 });

    document.body.append(visibleClip, clippingClip);
    visibleClip.appendChild(host);
    stubRect(requireEditorRoot(host), {});

    typeInto(host, "=SU");
    expect(suggestionsVisible()).toBe(true);

    editor.attachTo(clippingClip);
    typeInto(clippingClip, "=SUM");

    expect(suggestionsVisible()).toBe(false);

    destroy();
    visibleClip.remove();
    clippingClip.remove();
  });
});

describe("PopupController dead anchor math", () => {
  it("skips the function-signature lookup once fn-help is suppressed and stays inside the same call", () => {
    const harness = createEditorHarness({
      hyperformula: new PopupCacheHyperFormula() as never,
      language: FAKE_LANGUAGE,
      sheetId: 0,
      fnHelpOptions: { showClose: true },
    });
    const { host, destroy } = harness;

    document.body.appendChild(host);
    stubRect(requireEditorRoot(host), {});

    typeInto(host, "=SUM(1");
    expect(fnHelpVisible()).toBe(true);

    clickPopupClose(CN.fnHelp);
    expect(fnHelpVisible()).toBe(false);

    const detailsSpy = vi.spyOn(PopupCacheHyperFormula.prototype, "getFunctionDetails");

    moveCaretTo(host, 5);

    expect(fnHelpVisible()).toBe(false);
    expect(detailsSpy).not.toHaveBeenCalled();

    destroy();
    host.remove();
  });
});
