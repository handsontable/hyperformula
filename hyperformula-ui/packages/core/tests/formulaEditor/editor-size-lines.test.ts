import { afterEach, describe, expect, it, vi } from "vitest";
import { EventManager } from "../../src/events/eventManager";
import { EditorSizeController } from "../../src/formulaEditor/editorSizeController";
import { CN } from "../../src/theme/classNames";

function stubRect(element: HTMLElement, rect: Partial<DOMRect>): void {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect }) as DOMRect,
  });
}

function stubClientBox(
  element: HTMLElement,
  box: { width: number; height: number; left?: number; top?: number },
): void {
  Object.defineProperty(element, "clientWidth", { configurable: true, value: box.width });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: box.height });
  Object.defineProperty(element, "clientLeft", { configurable: true, value: box.left ?? 0 });
  Object.defineProperty(element, "clientTop", { configurable: true, value: box.top ?? 0 });
}

interface Harness {
  root: HTMLElement;
  overlay: HTMLElement;
  input: HTMLTextAreaElement;
  clip: HTMLElement;
  controller: EditorSizeController;
}

const cleanups: (() => void)[] = [];

function stubViewport(width: number, height: number): void {
  const docEl = document.documentElement;

  stubClientBox(docEl, { width, height });
  cleanups.push(() => {
    Reflect.deleteProperty(docEl, "clientWidth");
    Reflect.deleteProperty(docEl, "clientHeight");
    Reflect.deleteProperty(docEl, "clientLeft");
    Reflect.deleteProperty(docEl, "clientTop");
  });
}

function makeHarness(clipOverflow: string | null = "hidden", inputScrollHeight = 0): Harness {
  const clip = document.createElement("div");

  if (clipOverflow) {
    clip.style.overflow = clipOverflow;
  }

  stubRect(clip, { left: 10, right: 310, top: 20, bottom: 220 });
  stubClientBox(clip, { width: 300, height: 200 });

  const root = document.createElement("div");
  const overlay = document.createElement("div");
  const input = document.createElement("textarea");

  Object.defineProperty(input, "scrollHeight", {
    configurable: true,
    value: inputScrollHeight,
  });
  stubRect(root, { left: 210, top: 120 });
  root.style.lineHeight = "20px";
  root.style.setProperty("--hfe-padding-vertical", "2px");
  input.style.padding = "8px 6px";
  root.append(overlay, input);
  clip.appendChild(root);
  document.body.appendChild(clip);

  const events = new EventManager();
  const controller = new EditorSizeController(
    root,
    overlay,
    input,
    events.createScope("editor-size-lines-test"),
  );

  controller.attach();
  cleanups.push(() => {
    controller.detach();
    events.disposeAll();
    clip.remove();
  });

  return { root, overlay, input, clip, controller };
}

afterEach(() => {
  for (const cleanup of cleanups) {
    cleanup();
  }

  cleanups.length = 0;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("EditorSizeController line vars", () => {
  it("applies min-height from --hfe-editor-min-lines resolved against line height and padding", () => {
    const { root, controller } = makeHarness();

    root.style.setProperty("--hfe-editor-min-lines", "2");
    controller.update();

    expect(root.style.minHeight).toBe("max(100%, 56px)");
  });

  it("keeps the mount-parity floor so min-lines never shrinks the editor below its host", () => {
    const { root, controller } = makeHarness();

    root.style.setProperty("--hfe-editor-min-lines", "1");
    controller.update();

    expect(root.style.minHeight).toBe("max(100%, 36px)");
  });

  it("probe-measures the line box when the input line-height is non-numeric", () => {
    const { root, input, controller } = makeHarness();

    input.style.lineHeight = "normal";
    root.style.setProperty("--hfe-editor-min-lines", "2");

    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        return { height: this.style.visibility === "hidden" ? 17 : 0 } as DOMRect;
      });

    controller.update();
    rectSpy.mockRestore();

    expect(root.style.minHeight).toBe("max(100%, 50px)");
  });

  it("resolves line height from the input when it differs from the root", () => {
    const { root, input, controller } = makeHarness();

    input.style.lineHeight = "16px";
    root.style.setProperty("--hfe-editor-min-lines", "2");
    controller.update();

    expect(root.style.minHeight).toBe("max(100%, 48px)");
  });

  it("clamps min-lines to the clip cap so min-height never defeats max-height", () => {
    const { root, controller } = makeHarness("hidden", 186);

    root.style.setProperty("--hfe-editor-min-lines", "10");
    controller.update();

    expect(root.style.minHeight).toBe("max(100%, 100px)");
    expect(root.style.maxHeight).toBe("100px");
  });

  it("clamps min-lines to the max-lines ceiling when max resolves tighter than the clip", () => {
    const { root, controller } = makeHarness("hidden", 186);

    root.style.setProperty("--hfe-editor-min-lines", "5");
    root.style.setProperty("--hfe-editor-max-lines", "3");
    controller.update();

    expect(root.style.minHeight).toBe("max(100%, 76px)");
    expect(root.style.maxHeight).toBe("76px");
  });

  it("leaves min-height alone when the var is unset", () => {
    const { root, controller } = makeHarness();

    controller.update();

    expect(root.style.minHeight).toBe("");
  });

  it("caps height at --hfe-editor-max-lines when tighter than the clip edge", () => {
    const { root, overlay, controller } = makeHarness("hidden", 186);

    root.style.setProperty("--hfe-editor-max-lines", "3");
    controller.update();

    expect(root.style.maxHeight).toBe("76px");
    expect(overlay.style.maxHeight).toBe("76px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
  });

  it("keeps the clip cap when --hfe-editor-max-lines resolves wider", () => {
    const { root, controller } = makeHarness("hidden", 186);

    root.style.setProperty("--hfe-editor-max-lines", "20");
    controller.update();

    expect(root.style.maxHeight).toBe("100px");
  });

  it("caps height from --hfe-editor-max-lines without a clipping ancestor", () => {
    const { root, overlay, controller } = makeHarness(null, 186);

    stubViewport(1000, 800);
    root.style.setProperty("--hfe-editor-max-lines", "3");
    controller.update();

    expect(root.style.maxHeight).toBe("76px");
    expect(overlay.style.maxHeight).toBe("76px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
  });

  it("syncs overlay scroll from the textarea when capped by max-lines without a clipping ancestor", () => {
    const { root, overlay, input, controller } = makeHarness(null, 186);

    stubViewport(1000, 800);
    root.style.setProperty("--hfe-editor-max-lines", "3");
    Object.defineProperty(input, "scrollTop", { configurable: true, writable: true, value: 42 });
    Object.defineProperty(input, "scrollLeft", { configurable: true, writable: true, value: 7 });
    controller.update();

    expect(overlay.scrollTop).toBe(42);
    expect(overlay.scrollLeft).toBe(7);
  });

  it("syncs overlay scroll from the textarea on a manually resized root without a clipping ancestor", () => {
    const { root, overlay, input, controller } = makeHarness(null, 186);

    stubViewport(1000, 800);
    root.style.height = "40px";
    stubClientBox(root, { width: 100, height: 40 });
    Object.defineProperty(input, "scrollTop", { configurable: true, writable: true, value: 42 });
    Object.defineProperty(input, "scrollLeft", { configurable: true, writable: true, value: 7 });
    controller.update();

    expect(overlay.scrollTop).toBe(42);
    expect(overlay.scrollLeft).toBe(7);
  });

  it("syncs the overlay cap and scroll class to a manually resized root", () => {
    const { root, overlay, controller } = makeHarness("hidden", 186);

    root.style.height = "40px";
    stubClientBox(root, { width: 100, height: 40 });
    controller.update();

    expect(overlay.style.maxHeight).toBe("40px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
  });

  it("resetManualSize clears browser-written inline size", () => {
    const { root, controller } = makeHarness();

    root.style.height = "40px";
    root.style.width = "150px";
    controller.resetManualSize();

    expect(root.style.height).toBe("");
    expect(root.style.width).toBe("");
  });

  it("observes the root for native resize and disconnects on detach", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();

    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );

    const { root, controller } = makeHarness();

    expect(observe).toHaveBeenCalledWith(root);

    controller.detach();

    expect(disconnect).toHaveBeenCalled();
  });

  it("notifies onRootResize when the root is resized", () => {
    const captured: { callback: (() => void) | null } = { callback: null };

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          captured.callback = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );

    const onRootResize = vi.fn();
    const clip = document.createElement("div");
    const root = document.createElement("div");
    const overlay = document.createElement("div");
    const input = document.createElement("textarea");

    root.append(overlay, input);
    clip.appendChild(root);
    document.body.appendChild(clip);

    const events = new EventManager();
    const controller = new EditorSizeController(
      root,
      overlay,
      input,
      events.createScope("editor-size-resize-test"),
      onRootResize,
    );

    controller.attach();
    cleanups.push(() => {
      controller.detach();
      events.disposeAll();
      clip.remove();
    });

    expect(captured.callback).not.toBeNull();

    captured.callback?.();

    expect(onRootResize).toHaveBeenCalledTimes(1);
  });
});
