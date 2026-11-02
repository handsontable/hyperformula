import { describe, expect, it } from "vitest";
import { CN } from "../../src/theme/classNames";
import { createEditorHarness, requireEditorRoot, requireTextarea, sel, typeInto } from "../helpers";

const FAKE_LANGUAGE = "popupAnchorLang";

const ROOT_RECT = {
  x: 40,
  y: 60,
  left: 40,
  top: 60,
  right: 340,
  bottom: 110,
  width: 300,
  height: 50,
};

const TEXTAREA_RECT = {
  x: 52,
  y: 68,
  left: 52,
  top: 68,
  right: 320,
  bottom: 90,
  width: 268,
  height: 22,
};

const BAR_RECT = {
  x: 20,
  y: 40,
  left: 20,
  top: 40,
  right: 360,
  bottom: 130,
  width: 340,
  height: 90,
};

const OVERGROWN_ROOT_RECT = {
  x: 40,
  y: 60,
  left: 40,
  top: 60,
  right: 340,
  bottom: 220,
  width: 300,
  height: 160,
};

class PopupAnchorHyperFormula {
  getAvailableFunctions(): unknown {
    return [{ localizedName: "SUM", canonicalName: "SUM", shortDescription: "Adds numbers." }];
  }

  getFunctionDetails(): unknown {
    return undefined;
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

function stubRect(element: HTMLElement, rect: typeof ROOT_RECT): void {
  element.getBoundingClientRect = () => ({ ...rect, toJSON: () => ({}) }) as DOMRect;
}

function createPopupAnchorHarness(rootRect: typeof ROOT_RECT = ROOT_RECT) {
  const harness = createEditorHarness({
    hyperformula: new PopupAnchorHyperFormula() as never,
    language: FAKE_LANGUAGE,
    sheetId: 0,
  });

  stubRect(requireEditorRoot(harness.host), rootRect);
  stubRect(requireTextarea(harness.host), TEXTAREA_RECT);

  return harness;
}

describe("popup anchor", () => {
  it("anchors the suggestions popup to the editor root rect, not the textarea rect", () => {
    const { host, popupCtx, destroy } = createPopupAnchorHarness();

    typeInto(host, "=SU");

    const suggestions = popupCtx.portal.querySelector<HTMLElement>(sel(CN.suggestions));

    if (!suggestions) {
      throw new Error("expected suggestions popup in the portal");
    }

    expect(suggestions.style.left).toBe(`${ROOT_RECT.left}px`);
    expect(suggestions.style.top).toBe(`${ROOT_RECT.top + ROOT_RECT.height}px`);

    destroy();
  });

  it("anchors the suggestions popup below the formula bar border when bar-hosted", () => {
    const { host, popupCtx, destroy } = createPopupAnchorHarness();

    const bar = document.createElement("div");
    bar.className = CN.formulaBar;
    stubRect(bar, BAR_RECT);
    host.parentElement?.insertBefore(bar, host);
    bar.appendChild(host);

    typeInto(host, "=SU");

    const suggestions = popupCtx.portal.querySelector<HTMLElement>(sel(CN.suggestions));

    if (!suggestions) {
      throw new Error("expected suggestions popup in the portal");
    }

    expect(suggestions.style.left).toBe(`${ROOT_RECT.left}px`);
    expect(suggestions.style.top).toBe(`${BAR_RECT.top + BAR_RECT.height}px`);

    destroy();
  });

  it("anchors to the editor root's bottom when the bar editor grows past the bar's rect", () => {
    const { host, popupCtx, destroy } = createPopupAnchorHarness(OVERGROWN_ROOT_RECT);

    const bar = document.createElement("div");
    bar.className = CN.formulaBar;
    stubRect(bar, BAR_RECT);
    host.parentElement?.insertBefore(bar, host);
    bar.appendChild(host);

    typeInto(host, "=SU");

    const suggestions = popupCtx.portal.querySelector<HTMLElement>(sel(CN.suggestions));

    if (!suggestions) {
      throw new Error("expected suggestions popup in the portal");
    }

    expect(suggestions.style.left).toBe(`${OVERGROWN_ROOT_RECT.left}px`);
    expect(suggestions.style.top).toBe(`${OVERGROWN_ROOT_RECT.bottom}px`);

    destroy();
  });
});
