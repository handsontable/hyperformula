import { afterEach, describe, expect, it } from "vitest";
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
  events: EventManager;
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
  root.append(overlay, input);
  clip.appendChild(root);
  document.body.appendChild(clip);

  const events = new EventManager();
  const controller = new EditorSizeController(
    root,
    overlay,
    input,
    events.createScope("editor-size-test"),
  );

  const viewScope = events.createScope("editor-size-view-test");

  controller.attach();
  controller.listenToView(viewScope, window);
  viewScope.activate();
  cleanups.push(() => {
    controller.detach();
    events.disposeAll();
    clip.remove();
  });

  return { root, overlay, input, clip, controller, events };
}

afterEach(() => {
  for (const cleanup of cleanups) {
    cleanup();
  }

  cleanups.length = 0;
  document.body.replaceChildren();
});

describe("EditorSizeController", () => {
  it("caps the editor width at the clipping ancestor's client right edge", () => {
    const { root, controller } = makeHarness();

    controller.update();

    expect(root.style.maxWidth).toBe("100px");
  });

  it("tightens the width cap to a host-provided --hfe-editor-max-width", () => {
    const { root, controller } = makeHarness();

    root.style.setProperty("--hfe-editor-max-width", "60px");
    controller.update();

    expect(root.style.maxWidth).toBe("60px");
  });

  it("ignores a host width cap wider than the clip boundary", () => {
    const { root, controller } = makeHarness();

    root.style.setProperty("--hfe-editor-max-width", "500px");
    controller.update();

    expect(root.style.maxWidth).toBe("100px");
  });

  it("caps an RTL editor width at the clip's inner-left edge (editor right minus clip left)", () => {
    const { root, controller } = makeHarness();

    root.style.direction = "rtl";
    stubRect(root, { left: 210, right: 260, top: 120 });
    controller.update();

    expect(root.style.maxWidth).toBe("250px");
  });

  it("caps the editor height at the clipping ancestor's client bottom edge", () => {
    const { root, overlay, controller } = makeHarness("hidden", 186);

    controller.update();

    expect(root.style.maxHeight).toBe("100px");
    expect(overlay.style.maxHeight).toBe("100px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
  });

  it("keeps the scroll class off while the content fits the height cap", () => {
    const { root, controller } = makeHarness("hidden", 40);

    controller.update();

    expect(root.style.maxHeight).toBe("100px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(false);
  });

  it("caps the height at zero when the editor scrolls below the clip bottom", () => {
    const { root, overlay, controller } = makeHarness("hidden", 300);

    controller.update();
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
    expect(root.style.maxHeight).not.toBe("");

    stubRect(root, { left: 210, top: 260 });
    controller.update();

    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
    expect(root.style.maxHeight).toBe("0px");
    expect(overlay.style.maxHeight).toBe("0px");
  });

  it("never caps the height above the clip's client height when the clip has scrolled the editor up", () => {
    const { root, overlay, controller } = makeHarness("auto", 300);

    stubRect(root, { left: 210, top: -60 });
    controller.update();

    expect(root.style.maxHeight).toBe("200px");
    expect(overlay.style.maxHeight).toBe("200px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
  });

  it("subtracts the root border from the overlay height cap", () => {
    const { root, overlay, controller } = makeHarness("hidden", 186);

    root.style.borderTopWidth = "2px";
    root.style.borderBottomWidth = "2px";
    controller.update();

    expect(root.style.maxHeight).toBe("100px");
    expect(overlay.style.maxHeight).toBe("96px");
  });

  it("refresh() re-measures immediately and again on the next animation frame", async () => {
    const { root, controller } = makeHarness();

    controller.refresh();
    expect(root.style.maxWidth).toBe("100px");

    stubRect(root, { left: 260 });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(root.style.maxWidth).toBe("50px");
  });

  it("re-syncs the overlay scroll position from the textarea after resizing", () => {
    const { overlay, input, controller } = makeHarness("hidden", 186);

    Object.defineProperty(input, "scrollTop", { configurable: true, writable: true, value: 42 });
    Object.defineProperty(input, "scrollLeft", { configurable: true, writable: true, value: 7 });
    controller.update();

    expect(overlay.scrollTop).toBe(42);
    expect(overlay.scrollLeft).toBe(7);
  });

  it("pads the overlay to match the textarea content height so phantom caret lines align", () => {
    const { overlay, controller } = makeHarness("hidden", 186);

    controller.update();

    expect(overlay.style.paddingBottom).toBe("186px");
  });

  it("leaves the overlay padding unset when the textarea has no extra content height", () => {
    const { overlay, controller } = makeHarness("hidden", 0);

    controller.update();

    expect(overlay.style.paddingBottom).toBe("");
  });

  it("treats overflow-x-only clipping as a boundary", () => {
    const { root, clip, controller } = makeHarness(null);

    clip.style.overflowX = "auto";
    controller.update();

    expect(root.style.maxWidth).toBe("100px");
  });

  it("falls back to the viewport width cap when there is no clipping ancestor", () => {
    const { root, controller } = makeHarness(null);

    stubViewport(1000, 800);
    controller.update();

    expect(root.style.maxWidth).toBe("790px");
  });

  it("falls back to the viewport height cap when there is no clipping ancestor", () => {
    const { root, overlay, controller } = makeHarness(null, 700);

    stubViewport(1000, 800);
    controller.update();

    expect(root.style.maxHeight).toBe("680px");
    expect(overlay.style.maxHeight).toBe("680px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(true);
  });

  it("keeps the capped class off when the content fits the viewport fallback", () => {
    const { root, controller } = makeHarness(null, 40);

    stubViewport(1000, 800);
    controller.update();

    expect(root.style.maxHeight).toBe("680px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(false);
  });

  it("honors --hfe-editor-max-width in the viewport fallback", () => {
    const { root, controller } = makeHarness(null);

    stubViewport(1000, 800);
    root.style.setProperty("--hfe-editor-max-width", "60px");
    controller.update();

    expect(root.style.maxWidth).toBe("60px");
  });

  it("caps an RTL editor at the viewport's left edge when there is no clipping ancestor", () => {
    const { root, controller } = makeHarness(null);

    stubViewport(1000, 800);
    root.style.direction = "rtl";
    stubRect(root, { left: 210, right: 260, top: 120 });
    controller.update();

    expect(root.style.maxWidth).toBe("260px");
  });

  it("replaces stale caps with viewport caps when there is no clipping ancestor", () => {
    const { root, overlay, controller } = makeHarness(null);

    stubViewport(1000, 800);
    root.style.maxWidth = "50px";
    root.style.maxHeight = "50px";
    overlay.style.maxHeight = "50px";
    root.classList.add(CN.editorHeightCapped);
    controller.update();

    expect(root.style.maxWidth).toBe("790px");
    expect(root.style.maxHeight).toBe("680px");
    expect(overlay.style.maxHeight).toBe("680px");
    expect(root.classList.contains(CN.editorHeightCapped)).toBe(false);
  });

  it("keeps the width cap and zeroes the height cap when the editor sits past the clip edge", () => {
    const { root, controller } = makeHarness();

    stubRect(root, { left: 500, top: 500 });
    root.style.maxWidth = "100px";
    root.style.maxHeight = "100px";
    controller.update();

    expect(root.style.maxWidth).toBe("100px");
    expect(root.style.maxHeight).toBe("0px");
  });

  it("recomputes on ancestor scroll, coalesced to one measure per frame", async () => {
    const { root, clip } = makeHarness();

    clip.dispatchEvent(new Event("scroll", { bubbles: true }));
    clip.dispatchEvent(new Event("scroll", { bubbles: true }));
    expect(root.style.maxWidth).toBe("");

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(root.style.maxWidth).toBe("100px");
    expect(root.style.maxHeight).toBe("100px");
  });

  it("recomputes on window resize", async () => {
    const { root } = makeHarness();

    window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(root.style.maxWidth).toBe("100px");
  });

  it("stops reacting after detach", async () => {
    const { root, controller } = makeHarness();

    controller.detach();
    window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(root.style.maxWidth).toBe("");
  });
});
