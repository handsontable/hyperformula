import { afterEach, describe, expect, it, vi } from "vitest";
import { FocusTrap } from "../../src/ui/focusTrap";

function makeRoot(innerHtml: string): HTMLElement {
  const root = document.createElement("div");

  root.innerHTML = innerHtml;
  document.body.appendChild(root);

  return root;
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });

  target.dispatchEvent(event);

  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("FocusTrap", () => {
  it("cycles focusable elements in DOM order", () => {
    const root = makeRoot(
      '<a href="#one">one</a><span>text</span><button type="button">two</button><input />',
    );
    const trap = new FocusTrap(root);
    const tagAfterTab = (): string | undefined => {
      trap.interceptKeydown(keydown(document.activeElement ?? root, "Tab"));

      return document.activeElement?.tagName;
    };

    trap.focusFirst();

    expect(document.activeElement?.tagName).toBe("A");
    expect(tagAfterTab()).toBe("BUTTON");
    expect(tagAfterTab()).toBe("INPUT");
    expect(tagAfterTab()).toBe("A");
  });

  it("skips disabled, hidden, aria-hidden, non-href, and tabindex=-1 elements", () => {
    const root = makeRoot(
      '<button type="button" disabled>off</button><button type="button" hidden>hid</button>' +
        '<button type="button" aria-hidden="true">aria</button><a>no href</a>' +
        '<div tabindex="-1">skip</div><div tabindex="0">stop</div>',
    );
    const trap = new FocusTrap(root);

    trap.focusFirst();

    expect((document.activeElement as HTMLElement).getAttribute("tabindex")).toBe("0");

    trap.interceptKeydown(keydown(document.activeElement ?? root, "Tab"));

    expect((document.activeElement as HTMLElement).getAttribute("tabindex")).toBe("0");
  });

  it("focusFirst focuses the first focusable and reports success", () => {
    const root = makeRoot('<a href="#one">one</a><button type="button">two</button>');
    const trap = new FocusTrap(root);

    expect(trap.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(root.querySelector("a"));
  });

  it("focusFirst returns false when nothing is focusable", () => {
    const root = makeRoot("<span>text only</span>");
    const trap = new FocusTrap(root);

    expect(trap.focusFirst()).toBe(false);
  });

  it("Tab and Shift+Tab wrap through the focusables", () => {
    const root = makeRoot('<a href="#one">one</a><button type="button">two</button>');
    const trap = new FocusTrap(root);
    const link = root.querySelector("a") as HTMLElement;
    const button = root.querySelector("button") as HTMLElement;

    trap.focusFirst();
    trap.interceptKeydown(keydown(link, "Tab"));

    expect(document.activeElement).toBe(button);

    trap.interceptKeydown(keydown(button, "Tab"));

    expect(document.activeElement).toBe(link);

    trap.interceptKeydown(keydown(link, "Tab", { shiftKey: true }));

    expect(document.activeElement).toBe(button);
  });

  it("Shift+Tab from outside the focusables wraps to the last element", () => {
    const root = makeRoot('<a href="#one">one</a><button type="button">two</button><input />');
    const trap = new FocusTrap(root);
    const input = root.querySelector("input") as HTMLElement;

    (document.activeElement as HTMLElement | null)?.blur();
    trap.interceptKeydown(keydown(root, "Tab", { shiftKey: true }));

    expect(document.activeElement).toBe(input);
  });

  it("Escape is the default exit key: calls onExit and consumes the event", () => {
    const onExit = vi.fn();
    const root = makeRoot('<button type="button">one</button>');
    const trap = new FocusTrap(root, { onExit });
    const escapeEvent = keydown(root, "Escape");
    const functionKeyEvent = keydown(root, "F6");

    trap.interceptKeydown(escapeEvent);
    trap.interceptKeydown(functionKeyEvent);

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(functionKeyEvent.defaultPrevented).toBe(false);
  });

  it("honors custom exit keys", () => {
    const onExit = vi.fn();
    const root = makeRoot('<button type="button">one</button>');
    const trap = new FocusTrap(root, { onExit, exitKeys: ["F2", "F6"] });

    trap.interceptKeydown(keydown(root, "Escape"));

    expect(onExit).not.toHaveBeenCalled();

    trap.interceptKeydown(keydown(root, "F2"));
    trap.interceptKeydown(keydown(root, "F6"));

    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it("ignores Tab when nothing is focusable", () => {
    const root = makeRoot("<span>text only</span>");
    const trap = new FocusTrap(root);
    const event = keydown(root, "Tab");

    trap.interceptKeydown(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("hasFocus reports whether the active element sits inside the root", () => {
    const root = makeRoot('<button type="button">one</button>');
    const trap = new FocusTrap(root);

    expect(trap.hasFocus()).toBe(false);

    trap.focusFirst();

    expect(trap.hasFocus()).toBe(true);
  });
});

describe("FocusTrap inside a shadow root", () => {
  it("reports focus held by an element in the shadow root", () => {
    const hostEl = document.createElement("div");

    document.body.appendChild(hostEl);

    const shadow = hostEl.attachShadow({ mode: "open" });
    const root = document.createElement("div");
    const button = document.createElement("button");

    root.appendChild(button);
    shadow.appendChild(root);
    button.focus();

    expect(new FocusTrap(root).hasFocus()).toBe(true);

    hostEl.remove();
  });
});
