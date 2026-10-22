import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clear,
  createEl,
  createIcon,
  createSvgIcon,
  deepActiveElement,
  ensureRelativePosition,
} from "../../src/ui/dom";

describe("ensureRelativePosition", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("makes a statically positioned element relative and restores on cleanup", () => {
    const element = document.createElement("div");

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      position: "static",
    } as CSSStyleDeclaration);

    const restore = ensureRelativePosition(element);

    expect(element.style.position).toBe("relative");
    restore();
    expect(element.style.position).toBe("");
  });

  it("restores a pre-existing inline position", () => {
    const element = document.createElement("div");

    element.style.position = "static";

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      position: "static",
    } as CSSStyleDeclaration);

    const restore = ensureRelativePosition(element);

    expect(element.style.position).toBe("relative");
    restore();
    expect(element.style.position).toBe("static");
  });

  it("leaves a non-static element untouched", () => {
    const element = document.createElement("div");

    element.style.position = "absolute";

    const restore = ensureRelativePosition(element);

    expect(element.style.position).toBe("absolute");
    restore();
    expect(element.style.position).toBe("absolute");
  });
});

describe("createEl", () => {
  it("creates an element of the requested tag", () => {
    const element = createEl("button");

    expect(element.tagName).toBe("BUTTON");
  });

  it("sets string and number attributes verbatim", () => {
    const element = createEl("input", { type: "text", tabindex: 3 });

    expect(element.getAttribute("type")).toBe("text");
    expect(element.getAttribute("tabindex")).toBe("3");
  });

  it("renders a true boolean attribute as an empty-valued attribute", () => {
    const element = createEl("input", { disabled: true });

    expect(element.getAttribute("disabled")).toBe("");
  });

  it("skips attributes whose value is null, undefined, or false", () => {
    const element = createEl("div", { hidden: false, title: null, role: undefined });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(element.hasAttribute("title")).toBe(false);
    expect(element.hasAttribute("role")).toBe(false);
  });

  it("applies a style string as the style attribute", () => {
    const element = createEl("div", { style: "color: red" });

    expect(element.getAttribute("style")).toBe("color: red");
  });

  it("applies a style object property by property", () => {
    const element = createEl("div", { style: { left: "4px", "z-index": 10 } });

    expect(element.style.getPropertyValue("left")).toBe("4px");
    expect(element.style.getPropertyValue("z-index")).toBe("10");
  });

  it("maps both class and className keys to the class attribute", () => {
    expect(createEl("div", { class: "one" }).getAttribute("class")).toBe("one");
    expect(createEl("div", { className: "two" }).getAttribute("class")).toBe("two");
  });

  it("appends string children as text nodes and node children as-is", () => {
    const inner = document.createElement("em");
    const element = createEl("p", undefined, ["hello ", inner]);

    expect(element.childNodes).toHaveLength(2);
    expect(element.childNodes[0]?.textContent).toBe("hello ");
    expect(element.childNodes[1]).toBe(inner);
  });
});

describe("clear", () => {
  it("removes every child from the element", () => {
    const element = createEl("div", undefined, [
      "text",
      document.createElement("span"),
      document.createElement("span"),
    ]);

    clear(element);
    expect(element.childNodes).toHaveLength(0);

    clear(element);
    expect(element.childNodes).toHaveLength(0);
  });
});

describe("createSvgIcon", () => {
  const ICON = {
    attributes: { viewBox: "0 0 16 16", fill: "none" },
    paths: [{ d: "M0 0L4 4", stroke: "currentColor" }, { d: "M4 0L0 4" }],
  };

  it("builds an SVG element with its attributes and paths", () => {
    const icon = createSvgIcon(ICON);

    expect(icon).toBeInstanceOf(SVGSVGElement);
    expect(icon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(icon.getAttribute("viewBox")).toBe("0 0 16 16");
    expect([...icon.children].map((path) => path.getAttribute("d"))).toEqual([
      "M0 0L4 4",
      "M4 0L0 4",
    ]);
    expect(icon.children[0]?.getAttribute("stroke")).toBe("currentColor");
  });

  it("does not assign HTML, so it works under a Trusted Types policy", () => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");

    if (!descriptor) {
      throw new Error("expected an innerHTML descriptor");
    }

    Object.defineProperty(Element.prototype, "innerHTML", {
      ...descriptor,
      set() {
        throw new TypeError("This document requires 'TrustedHTML' assignment.");
      },
    });

    try {
      expect(() => createSvgIcon(ICON)).not.toThrow();
    } finally {
      Object.defineProperty(Element.prototype, "innerHTML", descriptor);
    }
  });
});

describe("createIcon", () => {
  it("builds the built-in SVG when no factory is given for the icon", () => {
    const icon = createIcon("close", { function: () => document.createElement("i") });

    expect(icon).toBeInstanceOf(SVGSVGElement);
  });

  it("calls the host factory for each icon it renders", () => {
    const factory = vi.fn(() => document.createElement("i"));
    const first = createIcon("close", { close: factory });
    const second = createIcon("close", { close: factory });

    expect(first.tagName).toBe("I");
    expect(second).not.toBe(first);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe("deepActiveElement", () => {
  it("returns the focused element inside an open shadow root, not its host", () => {
    const hostEl = document.createElement("div");

    document.body.appendChild(hostEl);

    const shadow = hostEl.attachShadow({ mode: "open" });
    const input = document.createElement("input");

    shadow.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(hostEl);
    expect(deepActiveElement(document)).toBe(input);

    hostEl.remove();
  });

  it("returns the document's active element outside shadow roots", () => {
    const input = document.createElement("input");

    document.body.appendChild(input);
    input.focus();

    expect(deepActiveElement(document)).toBe(input);

    input.remove();
  });
});
