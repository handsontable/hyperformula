import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CN } from "../../../src/theme/classNames";
import { ErrorPopup } from "../../../src/ui/popup/errorPopup";
import { PopupContext } from "../../../src/ui/popup/popupContext";
import { sel } from "../../helpers";

function rect(overrides: Partial<DOMRect>): DOMRect {
  return {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

describe("ErrorPopup bounds clamping", () => {
  let popupCtx: PopupContext;
  let popup: ErrorPopup;
  let container: HTMLElement;

  beforeEach(() => {
    popupCtx = new PopupContext();
    popup = new ErrorPopup({ container: popupCtx.portal });
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    popup.detach();
    popup.destroy();
    popupCtx.destroy();
    container.remove();
  });

  it("clamps the popup inside the grid container's bounds, not just the viewport", () => {
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => rect({ left: 100, top: 50, right: 500, bottom: 400, width: 400, height: 350 }),
      configurable: true,
    });

    popup.attach(container);

    const rootEl = popupCtx.portal.querySelector<HTMLElement>(sel(CN.errorPopup));

    if (!rootEl) {
      throw new Error("expected error popup root to exist");
    }

    Object.defineProperty(rootEl, "getBoundingClientRect", {
      value: () => rect({ width: 220, height: 60 }),
      configurable: true,
    });

    const cell = document.createElement("div");
    cell.dataset.hfeError = "#REF!";
    Object.defineProperty(cell, "getBoundingClientRect", {
      value: () => rect({ left: 460, top: 100, right: 495, bottom: 120, width: 35, height: 20 }),
      configurable: true,
    });
    container.appendChild(cell);

    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const containerRect = container.getBoundingClientRect();
    const left = Number.parseFloat(rootEl.style.left);
    const tolerance = 1;

    expect(popup.isVisible()).toBe(true);
    expect(left + 220).toBeLessThanOrEqual(containerRect.right + tolerance);
    cell.remove();
  });
});
