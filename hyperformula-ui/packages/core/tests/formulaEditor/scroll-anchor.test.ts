import { describe, expect, it, vi } from "vitest";
import { EventManager } from "../../src/events/eventManager";
import { ScrollAnchor } from "../../src/formulaEditor/scrollAnchor";
import type { EditorContext } from "../../src/formulaEditor/types";
import { nextFrame } from "../helpers";

class PopupStub {
  visible = false;
  closeCount = 0;
  private readonly ownedNodes = new Set<Node>();

  own(node: Node): void {
    this.ownedNodes.add(node);
  }

  contains(node: Node | null): boolean {
    return node instanceof Node && this.ownedNodes.has(node);
  }

  isVisible(): boolean {
    return this.visible;
  }

  close(): void {
    this.visible = false;
    this.closeCount += 1;
  }
}

interface ScrollAnchorHarness {
  anchor: ScrollAnchor;
  textarea: HTMLTextAreaElement;
  overlayRoot: HTMLDivElement;
  suggestions: PopupStub;
  fnHelp: PopupStub;
  reanchor: ReturnType<typeof vi.fn>;
  destroy: () => void;
}

function createScrollAnchorHarness(): ScrollAnchorHarness {
  const events = new EventManager();
  const textarea = document.createElement("textarea");
  const overlayRoot = document.createElement("div");
  const suggestions = new PopupStub();
  const fnHelp = new PopupStub();
  const reanchor = vi.fn();

  document.body.append(textarea, overlayRoot);

  const context = {
    input: { textarea },
    overlay: { root: overlayRoot },
    suggestions,
    fnHelp,
  } as unknown as EditorContext;
  const anchor = new ScrollAnchor(context, reanchor, events.createScope("scroll-anchor-test"));

  return {
    anchor,
    textarea,
    overlayRoot,
    suggestions,
    fnHelp,
    reanchor,
    destroy: () => {
      anchor.detach();
      events.disposeAll();
      textarea.remove();
      overlayRoot.remove();
    },
  };
}

function stubVisibleTextareaRects(textarea: HTMLTextAreaElement): void {
  textarea.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
}

function stubHiddenTextareaRects(textarea: HTMLTextAreaElement): void {
  textarea.getClientRects = () => [] as unknown as DOMRectList;
}

function dispatchAncestorScroll(): void {
  window.dispatchEvent(new Event("scroll"));
}

describe("ScrollAnchor", () => {
  it("mirrors textarea scroll offsets onto the overlay root", () => {
    const harness = createScrollAnchorHarness();

    harness.anchor.attach();
    harness.textarea.scrollTop = 42;
    harness.textarea.scrollLeft = 17;
    harness.textarea.dispatchEvent(new Event("scroll"));

    expect(harness.overlayRoot.scrollTop).toBe(42);
    expect(harness.overlayRoot.scrollLeft).toBe(17);

    harness.destroy();
  });

  it("does not mirror textarea scrolls before attach", () => {
    const harness = createScrollAnchorHarness();

    harness.textarea.scrollTop = 42;
    harness.textarea.dispatchEvent(new Event("scroll"));

    expect(harness.overlayRoot.scrollTop).toBe(0);

    harness.destroy();
  });

  it("reanchors on the next frame after an ancestor scroll while suggestions are visible", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(1);
    expect(harness.suggestions.closeCount).toBe(0);
    expect(harness.fnHelp.closeCount).toBe(0);

    harness.destroy();
  });

  it("coalesces ancestor scrolls into a single reanchor per frame", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    dispatchAncestorScroll();
    dispatchAncestorScroll();
    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(1);

    harness.destroy();
  });

  it("runs a settle reanchor one frame after the first, then stops", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(1);

    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(2);

    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(2);

    harness.destroy();
  });

  it("reanchors again when a scroll arrives during the pending frame", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    dispatchAncestorScroll();
    await nextFrame();
    await nextFrame();
    await nextFrame();
    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(3);

    harness.destroy();
  });

  it("skips the settle pass when the first reanchor closed both popups", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.reanchor.mockImplementation(() => {
      harness.suggestions.visible = false;
      harness.fnHelp.visible = false;
    });
    harness.anchor.attach();

    dispatchAncestorScroll();
    await nextFrame();
    await nextFrame();

    expect(harness.reanchor).toHaveBeenCalledTimes(1);

    harness.destroy();
  });

  it("ignores ancestor scrolls while both popups are hidden", async () => {
    const harness = createScrollAnchorHarness();

    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    await nextFrame();

    expect(harness.reanchor).not.toHaveBeenCalled();

    harness.destroy();
  });

  it("ignores scrolls that originate inside either popup", async () => {
    const harness = createScrollAnchorHarness();
    const suggestionsInner = document.createElement("div");
    const fnHelpInner = document.createElement("div");

    document.body.append(suggestionsInner, fnHelpInner);
    harness.suggestions.own(suggestionsInner);
    harness.fnHelp.own(fnHelpInner);
    harness.suggestions.visible = true;
    harness.fnHelp.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    suggestionsInner.dispatchEvent(new Event("scroll"));
    fnHelpInner.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(harness.reanchor).not.toHaveBeenCalled();

    suggestionsInner.remove();
    fnHelpInner.remove();
    harness.destroy();
  });

  it("closes both popups instead of reanchoring when the textarea has no client rects", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubHiddenTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    await nextFrame();

    expect(harness.suggestions.closeCount).toBe(1);
    expect(harness.fnHelp.closeCount).toBe(1);
    expect(harness.reanchor).not.toHaveBeenCalled();

    harness.destroy();
  });

  it("cancels a pending reanchor frame on detach", async () => {
    const harness = createScrollAnchorHarness();

    harness.suggestions.visible = true;
    stubVisibleTextareaRects(harness.textarea);
    harness.anchor.attach();

    dispatchAncestorScroll();
    harness.anchor.detach();
    await nextFrame();

    expect(harness.reanchor).not.toHaveBeenCalled();

    harness.destroy();
  });

  it("stops mirroring textarea scrolls after detach", () => {
    const harness = createScrollAnchorHarness();

    harness.anchor.attach();
    harness.anchor.detach();
    harness.textarea.scrollTop = 42;
    harness.textarea.dispatchEvent(new Event("scroll"));

    expect(harness.overlayRoot.scrollTop).toBe(0);

    harness.destroy();
  });
});
