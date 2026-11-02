import { afterEach, describe, expect, it } from "vitest";
import { EventManager } from "../../src/events/eventManager";
import { EditorSizeController } from "../../src/formulaEditor/editorSizeController";

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

function makeClip(left: number, width: number): HTMLElement {
  const clip = document.createElement("div");

  clip.style.overflow = "hidden";
  stubRect(clip, { left, right: left + width, top: 20, bottom: 220 });
  stubClientBox(clip, { width, height: 200 });

  return clip;
}

const cleanups: (() => void)[] = [];

afterEach(() => {
  for (const cleanup of cleanups) {
    cleanup();
  }

  cleanups.length = 0;
  document.body.replaceChildren();
});

describe("EditorSizeController clip caching", () => {
  it("keeps using the previously resolved clipping ancestor after the root moves, until invalidated", () => {
    const originalClip = makeClip(10, 300);
    const relocatedClip = makeClip(110, 150);
    const root = document.createElement("div");
    const overlay = document.createElement("div");
    const input = document.createElement("textarea");

    stubRect(root, { left: 210, top: 120 });
    root.append(overlay, input);
    originalClip.appendChild(root);
    document.body.append(originalClip, relocatedClip);

    const events = new EventManager();
    const controller = new EditorSizeController(
      root,
      overlay,
      input,
      events.createScope("editor-size-cache-test"),
    );

    controller.attach();
    cleanups.push(() => {
      controller.detach();
      events.disposeAll();
      originalClip.remove();
      relocatedClip.remove();
    });

    controller.update();
    expect(root.style.maxWidth).toBe("100px");

    relocatedClip.appendChild(root);
    controller.update();

    expect(root.style.maxWidth).toBe("100px");
  });

  it("re-resolves the clipping ancestor after invalidateCache()", () => {
    const originalClip = makeClip(10, 300);
    const relocatedClip = makeClip(110, 150);
    const root = document.createElement("div");
    const overlay = document.createElement("div");
    const input = document.createElement("textarea");

    stubRect(root, { left: 210, top: 120 });
    root.append(overlay, input);
    originalClip.appendChild(root);
    document.body.append(originalClip, relocatedClip);

    const events = new EventManager();
    const controller = new EditorSizeController(
      root,
      overlay,
      input,
      events.createScope("editor-size-cache-test"),
    );

    controller.attach();
    cleanups.push(() => {
      controller.detach();
      events.disposeAll();
      originalClip.remove();
      relocatedClip.remove();
    });

    controller.update();
    expect(root.style.maxWidth).toBe("100px");

    relocatedClip.appendChild(root);
    controller.invalidateCache();
    controller.update();

    expect(root.style.maxWidth).toBe("50px");
  });
});
