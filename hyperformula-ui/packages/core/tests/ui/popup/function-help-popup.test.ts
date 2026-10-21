import { afterEach, describe, expect, it, vi } from "vitest";
import type { FunctionSignature } from "../../../src/engine/types";
import { CN } from "../../../src/theme/classNames";
import { FunctionHelpPopup } from "../../../src/ui/popup/functionHelpPopup";
import { sel } from "../../helpers";

const SIGNATURE: FunctionSignature = {
  name: "SUM",
  params: [
    { label: "value1", optional: false, description: "The first number or range to add together" },
    { label: "value2", optional: true, description: "Additional numbers or ranges to add" },
  ],
  repeatLast: 1,
  description: "Adds all numbers in a range",
  example: "SUM(A1:A10)",
  docUrl:
    "https://hyperformula.handsontable.com/guide/built-in-functions.html#math-and-trigonometry",
};

function makeHelp(): FunctionHelpPopup {
  return new FunctionHelpPopup();
}

describe("FunctionHelpPopup rendering", () => {
  it("renders the function name and highlights the active param in the signature row", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    const sig = document.body.querySelector(sel(CN.fnHelpSignature));

    expect(sig?.textContent).toContain("SUM");
    expect(sig?.querySelector(sel(CN.fnHelpArgActive))?.textContent).toBe("value1");

    help.destroy();
  });

  it("renders the example section when example is present", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    expect(document.body.querySelector(sel(CN.fnHelpExample))?.textContent).toBe("SUM(A1:A10)");

    help.destroy();
  });

  it("renders the about section when description is present", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    expect(document.body.querySelector(sel(CN.fnHelpAbout))?.textContent).toBe(
      "Adds all numbers in a range",
    );

    help.destroy();
  });

  it("renders param rows with descriptions", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    const descs = Array.from(document.body.querySelectorAll(sel(CN.fnHelpParamDesc))).map(
      (el) => el.textContent,
    );

    expect(descs).toContain("The first number or range to add together");
    expect(descs).toContain("Additional numbers or ranges to add");

    help.destroy();
  });

  it("highlights the active param name in the param list", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    const activeParamName = document.body.querySelector(sel(CN.fnHelpParamNameActive));

    expect(activeParamName?.textContent).toBe("value1");

    help.destroy();
  });

  it("annotates the optional repeatable param in the param list", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 1, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    const paramNames = Array.from(document.body.querySelectorAll(sel(CN.fnHelpParamName))).map(
      (el) => el.textContent,
    );

    expect(paramNames[1]).toContain("value2...");
    expect(paramNames[1]).toContain("[optional]");
    expect(paramNames[1]).toContain("repeatable");

    help.destroy();
  });

  it("renders the learn more link when docUrl is present", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    const link = document.body.querySelector(sel(CN.fnHelpLearnMore)) as HTMLAnchorElement;

    expect(link?.href).toBe(SIGNATURE.docUrl);
    expect(link?.textContent).toContain("Learn more");

    help.destroy();
  });

  it("omits the learn more link when docUrl is not an http or https URL", () => {
    for (const docUrl of ["javascript:alert(1)", "data:text/html,x", "not a url"]) {
      const help = makeHelp();

      help.show({ ...SIGNATURE, docUrl }, 0, {
        left: 0,
        top: 0,
        height: 20,
        width: 100,
        direction: "ltr",
      });

      expect(document.body.querySelector(sel(CN.fnHelpLearnMore))).toBeNull();

      help.destroy();
    }
  });

  it("omits example, about, params, and learn more when the signature has none", () => {
    const help = makeHelp();
    const minimal: FunctionSignature = { name: "NOW", params: [], repeatLast: 0 };

    help.show(minimal, 0, { left: 0, top: 0, height: 20, width: 100, direction: "ltr" });

    expect(document.body.querySelector(sel(CN.fnHelpExample))).toBeNull();
    expect(document.body.querySelector(sel(CN.fnHelpAbout))).toBeNull();
    expect(document.body.querySelector(sel(CN.fnHelpSeparator))).toBeNull();
    expect(document.body.querySelector(sel(CN.fnHelpLearnMore))).toBeNull();

    help.destroy();
  });

  it("makes the body keyboard-focusable when it has content", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, ANCHOR);

    const body = document.body.querySelector(sel(CN.fnHelpBody));

    expect(body?.getAttribute("tabindex")).toBe("0");

    help.destroy();
  });

  it("keeps an empty body out of the tab order", () => {
    const help = makeHelp();
    const minimal: FunctionSignature = { name: "NOW", params: [], repeatLast: 0 };

    help.show(minimal, 0, ANCHOR);

    const body = document.body.querySelector(sel(CN.fnHelpBody));

    expect(body?.hasAttribute("tabindex")).toBe(false);

    help.destroy();
  });

  it("advertises the F6 exit on the popup root", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, ANCHOR);

    const root = document.body.querySelector(sel(CN.fnHelp));

    expect(root?.getAttribute("aria-keyshortcuts")).toBe("F6");

    help.destroy();
  });
});

const ANCHOR = { left: 0, top: 0, height: 20, width: 100, direction: "ltr" } as const;

function makeFocusableHelp(onFocusReturn = vi.fn()) {
  const help = new FunctionHelpPopup({ onFocusReturn, options: { showClose: true } });

  help.show(SIGNATURE, 0, ANCHOR);
  const closeButton = document.body.querySelector<HTMLElement>(sel(CN.popupClose));
  const learnMore = document.body.querySelector<HTMLElement>(sel(CN.fnHelpLearnMore));
  const body = document.body.querySelector<HTMLElement>(sel(CN.fnHelpBody));

  if (!closeButton || !learnMore || !body) {
    throw new Error("expected the body, close button, and learn more link");
  }

  return { help, onFocusReturn, closeButton, learnMore, body };
}

function pressOn(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });

  target.dispatchEvent(event);

  return event;
}

describe("FunctionHelpPopup focus scope", () => {
  it("exposes a dialog role labeled with the function name", () => {
    const help = makeHelp();

    help.show(SIGNATURE, 0, ANCHOR);
    const root = document.body.querySelector(sel(CN.fnHelp));

    expect(root?.getAttribute("role")).toBe("dialog");
    expect(root?.getAttribute("aria-label")).toBe("SUM function help");

    help.destroy();
  });

  it("focusFirst focuses the scrollable body as the first focusable in DOM order", () => {
    const { help, body } = makeFocusableHelp();

    expect(help.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(body);

    help.destroy();
  });

  it("focusFirst focuses the close button when it is the only focusable element", () => {
    const help = new FunctionHelpPopup({ options: { showClose: true } });
    const bare: FunctionSignature = { name: "NOW", params: [], repeatLast: 0 };

    help.show(bare, 0, ANCHOR);

    expect(help.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(document.body.querySelector(sel(CN.popupClose)));

    help.destroy();
  });

  it("focusFirst returns false when the popup has no focusable elements", () => {
    const help = new FunctionHelpPopup();
    const bare: FunctionSignature = { name: "NOW", params: [], repeatLast: 0 };

    help.show(bare, 0, ANCHOR);

    expect(help.focusFirst()).toBe(false);

    help.destroy();
  });

  it("Tab wraps focus through the body, learn more link, and close button", () => {
    const { help, closeButton, learnMore, body } = makeFocusableHelp();

    help.focusFirst();
    pressOn(body, "Tab");

    expect(document.activeElement).toBe(learnMore);

    pressOn(learnMore, "Tab");

    expect(document.activeElement).toBe(closeButton);

    pressOn(closeButton, "Tab");

    expect(document.activeElement).toBe(body);

    pressOn(body, "Tab", { shiftKey: true });

    expect(document.activeElement).toBe(closeButton);

    help.destroy();
  });

  it("Escape inside the popup closes it and returns focus", () => {
    const { help, onFocusReturn, closeButton } = makeFocusableHelp();

    help.focusFirst();
    const event = pressOn(closeButton, "Escape");

    expect(onFocusReturn).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(help.isVisible()).toBe(false);

    help.destroy();
  });

  it("F6 inside the popup returns focus without closing", () => {
    const { help, onFocusReturn, closeButton } = makeFocusableHelp();

    help.focusFirst();
    pressOn(closeButton, "F6");

    expect(onFocusReturn).toHaveBeenCalledTimes(1);
    expect(help.isVisible()).toBe(true);

    help.destroy();
  });

  it("returns focus when the popup closes while holding focus", () => {
    const { help, onFocusReturn } = makeFocusableHelp();

    help.focusFirst();
    help.close();

    expect(onFocusReturn).toHaveBeenCalledTimes(1);

    help.destroy();
  });

  it("does not return focus when the popup closes without holding focus", () => {
    const { help, onFocusReturn } = makeFocusableHelp();

    help.close();

    expect(onFocusReturn).not.toHaveBeenCalled();

    help.destroy();
  });

  it("Escape inside the popup closes it and reports explicit close", () => {
    const onExplicitClose = vi.fn();
    const popup = new FunctionHelpPopup({ onExplicitClose, options: { showClose: true } });

    popup.show(SIGNATURE, 0, ANCHOR);

    const popupRoot = document.body.querySelector<HTMLElement>(sel(CN.fnHelp));

    if (!popupRoot) {
      throw new Error("expected fn-help root");
    }

    popup.focusFirst();
    popupRoot.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );

    expect(popup.isVisible()).toBe(false);
    expect(onExplicitClose).toHaveBeenCalledOnce();

    popup.destroy();
  });

  it("keeps keydown events inside the popup while it holds focus", () => {
    const { help, learnMore } = makeFocusableHelp();
    const documentKeydown = vi.fn();

    document.addEventListener("keydown", documentKeydown);
    help.focusFirst();
    const enterEvent = pressOn(learnMore, "Enter");

    pressOn(learnMore, "ArrowDown");
    pressOn(learnMore, " ");

    expect(documentKeydown).not.toHaveBeenCalled();
    expect(enterEvent.defaultPrevented).toBe(false);

    document.removeEventListener("keydown", documentKeydown);
    help.destroy();
  });

  it("does not trap Tab while the popup is docked into a host container", () => {
    const { help, learnMore } = makeFocusableHelp();
    const host = document.createElement("aside");

    document.body.appendChild(host);
    help.attachToHost(host);
    help.show(SIGNATURE, 0, ANCHOR);
    learnMore.focus();
    const tabEvent = pressOn(learnMore, "Tab");

    expect(tabEvent.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(learnMore);

    help.destroy();
    host.remove();
  });
});

function makeReanchorHelp() {
  const focusable = makeFocusableHelp();
  const root = focusable.closeButton.closest<HTMLElement>(sel(CN.fnHelp));

  if (!root) {
    throw new Error("expected popup root");
  }

  return { ...focusable, root };
}

describe("FunctionHelpPopup reanchor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("preserves DOM and focus when reshown with the same signature and active arg", () => {
    const { help, body, learnMore, root } = makeReanchorHelp();

    help.focusFirst();
    help.show({ ...SIGNATURE }, 0, { ...ANCHOR, top: 40 });

    expect(document.activeElement).toBe(body);
    expect(root.querySelector(sel(CN.fnHelpLearnMore))).toBe(learnMore);

    help.destroy();
  });

  it("rebuilds content when reshown with a different active arg", () => {
    const { help, root } = makeReanchorHelp();

    help.show(SIGNATURE, 1, ANCHOR);

    expect(root.querySelector(sel(CN.fnHelpArgActive))?.textContent).toBe("[value2, ...]");

    help.destroy();
  });

  it("rebuilds content when reshown with a different signature", () => {
    const { help, root } = makeReanchorHelp();

    help.show({ name: "NOW", params: [], repeatLast: 0 }, 0, ANCHOR);

    expect(root.querySelector(sel(CN.fnHelpName))?.textContent).toBe("NOW");

    help.destroy();
  });

  it("repositions when reshown with the same signature at a new anchor", () => {
    const { help, root } = makeReanchorHelp();
    const before = root.style.top;

    help.show({ ...SIGNATURE }, 0, { ...ANCHOR, top: 300 });

    expect(root.style.top).not.toBe(before);

    help.destroy();
  });
});
