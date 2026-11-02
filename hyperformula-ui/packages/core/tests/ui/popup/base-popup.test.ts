import { describe, expect, it } from "vitest";
import { CN } from "../../../src/theme/classNames";
import { BasePopup } from "../../../src/ui/popup/basePopup";
import { sel } from "../../helpers";

class TestPopup extends BasePopup {
  protected createRoot(): HTMLElement {
    const el = document.createElement("div");
    el.className = "test-popup";
    el.hidden = true;
    return el;
  }

  protected renderContent(): void {
    const span = document.createElement("span");
    span.textContent = "content";
    this.root.appendChild(span);
  }
}

class VisibilityHookPopup extends TestPopup {
  visibilityLog: boolean[] = [];

  protected override onVisibilityChanged(visible: boolean): void {
    this.visibilityLog.push(visible);
  }
}

describe("BasePopup", () => {
  it("fires onVisibilityChanged only on real visibility transitions", () => {
    const popup = new VisibilityHookPopup();
    const anchor = { left: 0, top: 0, height: 20, width: 0, direction: "ltr" as const };

    popup.close();
    expect(popup.visibilityLog).toEqual([]);

    popup.open(anchor);
    popup.open(anchor);
    expect(popup.visibilityLog).toEqual([true]);

    popup.close();
    popup.close();
    expect(popup.visibilityLog).toEqual([true, false]);
    popup.destroy();
  });

  it("appends to document.body on construction", () => {
    const popup = new TestPopup();
    expect(document.body.querySelector(".test-popup")).not.toBeNull();
    popup.destroy();
  });

  it("does not set an inline z-index (z-index is owned by CSS)", () => {
    const popup = new TestPopup();
    const rootEl = document.body.querySelector<HTMLElement>(".test-popup");

    if (!rootEl) {
      throw new Error("expected .test-popup to exist");
    }

    expect(rootEl.style.zIndex).toBe("");
    popup.destroy();
  });

  it("appends to a custom container when provided", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    new TestPopup({ container });
    expect(container.querySelector(".test-popup")).not.toBeNull();
    container.remove();
  });

  it("destroy() removes root from the DOM", () => {
    const popup = new TestPopup();
    popup.destroy();
    expect(document.body.querySelector(".test-popup")).toBeNull();
  });

  it("isVisible() reflects open/close state", () => {
    const popup = new TestPopup();
    expect(popup.isVisible()).toBe(false);
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(popup.isVisible()).toBe(true);
    popup.close();
    expect(popup.isVisible()).toBe(false);
    popup.destroy();
  });

  it("reposition() applies maxHeight when the popup doesn't fit below the anchor", () => {
    const popup = new TestPopup();
    const rootEl = document.body.querySelector<HTMLElement>(".test-popup");

    if (!rootEl) {
      throw new Error("expected .test-popup to exist");
    }

    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(rootEl, "getBoundingClientRect", {
      value: () => ({ width: 200, height: 100 }) as DOMRect,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", { value: 120, configurable: true });

    popup.open({ left: 0, top: 14, height: 10, width: 0, direction: "ltr" });

    expect(rootEl.style.maxHeight).toBe("84px");
    popup.destroy();
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      configurable: true,
    });
  });

  it("reposition() applies and clears maxWidth from the strategy", () => {
    let cappedWidth: number | undefined = 150;
    const stubStrategy = {
      compute: () => ({
        left: 0,
        top: 0,
        ...(cappedWidth === undefined ? {} : { maxWidth: cappedWidth }),
      }),
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const popup = new TestPopup({ container, strategy: stubStrategy });
    const rootEl = container.querySelector<HTMLElement>(".test-popup");

    if (!rootEl) {
      throw new Error("expected .test-popup to exist");
    }

    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(rootEl.style.maxWidth).toBe("150px");

    cappedWidth = undefined;
    popup.reposition({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(rootEl.style.maxWidth).toBe("");

    popup.destroy();
    container.remove();
  });

  it("reposition() clears maxHeight when the popup fits below the anchor", () => {
    const popup = new TestPopup();
    const rootEl = document.body.querySelector<HTMLElement>(".test-popup");

    if (!rootEl) {
      throw new Error("expected .test-popup to exist");
    }

    Object.defineProperty(rootEl, "getBoundingClientRect", {
      value: () => ({ width: 200, height: 20 }) as DOMRect,
      configurable: true,
    });

    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });

    expect(rootEl.style.maxHeight).toBe("");
    popup.destroy();
  });

  it("reposition() does not oscillate maxHeight across repeated calls with an unchanged anchor", () => {
    const popup = new TestPopup();
    const rootEl = document.body.querySelector<HTMLElement>(".test-popup");

    if (!rootEl) {
      throw new Error("expected .test-popup to exist");
    }

    const naturalHeight = 100;

    Object.defineProperty(rootEl, "getBoundingClientRect", {
      value: () => {
        const clamped = rootEl.style.maxHeight;
        const height = clamped ? Number.parseFloat(clamped) : naturalHeight;

        return { width: 200, height } as DOMRect;
      },
      configurable: true,
    });

    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, "innerHeight", { value: 120, configurable: true });

    const anchor = { left: 0, top: 14, height: 10, width: 0, direction: "ltr" as const };

    popup.open(anchor);
    expect(rootEl.style.maxHeight).toBe("84px");

    popup.reposition(anchor);
    expect(rootEl.style.maxHeight).toBe("84px");

    popup.reposition(anchor);
    expect(rootEl.style.maxHeight).toBe("84px");

    popup.destroy();
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      configurable: true,
    });
  });

  it("close() is a no-op when already closed", () => {
    const popup = new TestPopup();
    expect(() => popup.close()).not.toThrow();
    popup.destroy();
  });

  it("contains() returns true for a node inside the root", () => {
    const popup = new TestPopup();
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    const inner = document.body.querySelector(".test-popup span");

    if (!inner) {
      throw new Error("expected .test-popup span to exist");
    }

    expect(popup.contains(inner)).toBe(true);
    popup.destroy();
  });

  it("open() clears stale content before re-rendering", () => {
    const popup = new TestPopup();
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(document.body.querySelectorAll(".test-popup span").length).toBe(1);
    popup.destroy();
  });

  it("renders no close button by default", () => {
    const popup = new TestPopup();
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();
    popup.destroy();
  });

  it("renders no close button when showClose is false", () => {
    const popup = new TestPopup({ showClose: false });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();
    popup.destroy();
  });

  it("clicking the close button closes the popup", () => {
    const popup = new TestPopup({ showClose: true });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    const btn = document.body.querySelector<HTMLButtonElement>(sel(CN.popupClose));

    if (!btn) {
      throw new Error("expected close button");
    }

    btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    expect(popup.isVisible()).toBe(false);
    popup.destroy();
  });

  it("clicking the close button fires onExplicitClose", () => {
    let clicked = 0;
    const popup = new TestPopup({ showClose: true, onExplicitClose: () => clicked++ });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    const btn = document.body.querySelector<HTMLButtonElement>(sel(CN.popupClose));

    if (!btn) {
      throw new Error("expected close button");
    }

    btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    expect(clicked).toBe(1);
    popup.destroy();
  });

  it("pressing Enter on the close button closes the popup and fires onExplicitClose", () => {
    let clicked = 0;
    const popup = new TestPopup({ showClose: true, onExplicitClose: () => clicked++ });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    const btn = document.body.querySelector<HTMLButtonElement>(sel(CN.popupClose));

    if (!btn) {
      throw new Error("expected close button");
    }

    btn.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    expect(popup.isVisible()).toBe(false);
    expect(clicked).toBe(1);
    popup.destroy();
  });

  it("programmatic close() does not fire onExplicitClose", () => {
    let clicked = 0;
    const popup = new TestPopup({ showClose: true, onExplicitClose: () => clicked++ });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    popup.close();
    expect(clicked).toBe(0);
    popup.destroy();
  });

  it("close button is re-appended on every open()", () => {
    const popup = new TestPopup({ showClose: true });
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    popup.close();
    popup.open({ left: 0, top: 0, height: 20, width: 0, direction: "ltr" });
    expect(document.body.querySelector(sel(CN.popupClose))).not.toBeNull();
    popup.destroy();
  });

  describe("host attach", () => {
    const anchor = { left: 0, top: 0, height: 20, width: 0, direction: "ltr" as const };

    function makeHost(): HTMLElement {
      const host = document.createElement("aside");
      document.body.appendChild(host);
      return host;
    }

    it("attachToHost re-parents the root into the host and adds the hosted class", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host);

      const rootEl = host.querySelector<HTMLElement>(".test-popup");
      expect(rootEl).not.toBeNull();
      expect(rootEl?.classList.contains(CN.popupHosted)).toBe(true);
      expect(popup.isAttachedToHost).toBe(true);
      popup.destroy();
      host.remove();
    });

    it("open() while attached to a host applies no inline positioning and renders no close button", () => {
      const host = makeHost();
      const popup = new TestPopup({ showClose: true });

      popup.attachToHost(host);
      popup.open(anchor);

      const rootEl = host.querySelector<HTMLElement>(".test-popup");
      expect(rootEl?.style.left).toBe("");
      expect(rootEl?.style.top).toBe("");
      expect(rootEl?.style.maxHeight).toBe("");
      expect(host.querySelector(sel(CN.popupClose))).toBeNull();
      expect(popup.isVisible()).toBe(true);
      popup.destroy();
      host.remove();
    });

    it("attachToHost while open keeps the popup open and clears inline positioning", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.open(anchor);
      popup.attachToHost(host);

      const rootEl = host.querySelector<HTMLElement>(".test-popup");
      expect(popup.isVisible()).toBe(true);
      expect(rootEl?.style.left).toBe("");
      expect(rootEl?.style.top).toBe("");
      expect(rootEl?.style.maxHeight).toBe("");
      popup.destroy();
      host.remove();
    });

    it("reposition() is a no-op while attached to a host", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host);
      popup.open(anchor);
      popup.reposition({ ...anchor, top: 500 });

      const rootEl = host.querySelector<HTMLElement>(".test-popup");
      expect(rootEl?.style.top).toBe("");
      popup.destroy();
      host.remove();
    });

    it("detachFromHost closes an open popup and returns the root to its original container", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host);
      popup.open(anchor);
      popup.detachFromHost();

      expect(popup.isVisible()).toBe(false);
      expect(popup.isAttachedToHost).toBe(false);
      expect(host.querySelector(".test-popup")).toBeNull();
      const rootEl = document.querySelector<HTMLElement>(".test-popup");
      expect(rootEl).not.toBeNull();
      expect(rootEl?.parentElement).toBe(document.body);
      expect(rootEl?.classList.contains(CN.popupHosted)).toBe(false);
      popup.destroy();
      host.remove();
    });

    it("open() after detachFromHost renders the close button again", () => {
      const host = makeHost();
      const popup = new TestPopup({ showClose: true });

      popup.attachToHost(host);
      popup.open(anchor);
      popup.detachFromHost();
      popup.open(anchor);

      expect(document.body.querySelector(sel(CN.popupClose))).not.toBeNull();
      popup.destroy();
      host.remove();
    });

    it("detachFromHost is a no-op when not attached", () => {
      const popup = new TestPopup();

      expect(() => popup.detachFromHost()).not.toThrow();
      expect(popup.isAttachedToHost).toBe(false);
      popup.destroy();
    });

    it("attachToHost applies the theme class to the root and detachFromHost removes it", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host, "my-theme");

      const rootEl = host.querySelector<HTMLElement>(".test-popup");
      expect(rootEl?.classList.contains("my-theme")).toBe(true);

      popup.detachFromHost();

      expect(rootEl?.classList.contains("my-theme")).toBe(false);
      popup.destroy();
      host.remove();
    });

    it("re-attach with a different theme class swaps it instead of accumulating", () => {
      const host = makeHost();
      const otherHost = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host, "theme-one");
      popup.attachToHost(otherHost, "theme-two");

      const rootEl = otherHost.querySelector<HTMLElement>(".test-popup");
      expect(rootEl?.classList.contains("theme-one")).toBe(false);
      expect(rootEl?.classList.contains("theme-two")).toBe(true);
      popup.destroy();
      host.remove();
      otherHost.remove();
    });

    it("attachToHost without a theme class leaves the root classes untouched on detach", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host);
      popup.detachFromHost();

      const rootEl = document.querySelector<HTMLElement>(".test-popup");
      expect(rootEl?.className).toBe(`test-popup ${CN.popup}`);
      popup.destroy();
      host.remove();
    });

    it("destroy() removes a hosted root from the host", () => {
      const host = makeHost();
      const popup = new TestPopup();

      popup.attachToHost(host);
      popup.destroy();

      expect(host.querySelector(".test-popup")).toBeNull();
      host.remove();
    });
  });
});
