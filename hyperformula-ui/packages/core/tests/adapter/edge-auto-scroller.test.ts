import { afterEach, describe, expect, it, vi } from "vitest";
import { EdgeAutoScroller } from "../../src/adapter/edgeAutoScroller";

interface ScrollStub {
  scrollTop: number;
  scrollLeft: number;
  clientTop: number;
  clientLeft: number;
  clientWidth: number;
  clientHeight: number;
  getBoundingClientRect(): DOMRect;
}

function makeScrollElement(): ScrollStub {
  return {
    scrollTop: 100,
    scrollLeft: 100,
    clientTop: 0,
    clientLeft: 0,
    clientWidth: 185,
    clientHeight: 85,
    getBoundingClientRect: () =>
      ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect,
  };
}

function makeScroller(scrollEl: ScrollStub | null = makeScrollElement()) {
  const onStep = vi.fn();
  const scroller = new EdgeAutoScroller({
    getScrollElement: () => scrollEl as unknown as HTMLElement | null,
    onStep,
  });

  return { scroller, onStep, scrollEl };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EdgeAutoScroller", () => {
  it("scrolls down when the pointer is below the element", () => {
    const { scroller, scrollEl } = makeScroller();

    scroller.update(50, 140);

    expect(scrollEl?.scrollTop).toBeGreaterThan(100);
    expect(scrollEl?.scrollLeft).toBe(100);
    scroller.stop();
  });

  it("scrolls horizontally when the pointer is past the side edges", () => {
    const { scroller, scrollEl } = makeScroller();

    scroller.update(260, 50);

    expect(scrollEl?.scrollLeft).toBeGreaterThan(100);

    scroller.update(-60, 50);

    expect(scrollEl?.scrollLeft).toBeLessThan(200);
    scroller.stop();
  });

  it("reports each step with the pointer clamped inside the client box, above any scrollbar", () => {
    const { scroller, onStep } = makeScroller();

    scroller.update(50, 140);

    expect(onStep).toHaveBeenCalledTimes(1);
    const [clampedX, clampedY] = onStep.mock.calls[0] as [number, number];

    expect(clampedX).toBe(50);
    expect(clampedY).toBeLessThanOrEqual(83);
    expect(clampedY).toBeGreaterThan(75);
    scroller.stop();
  });

  it("does nothing while the pointer stays inside the element", () => {
    const { scroller, onStep, scrollEl } = makeScroller();

    scroller.update(50, 50);

    expect(onStep).not.toHaveBeenCalled();
    expect(scrollEl?.scrollTop).toBe(100);
    scroller.stop();
  });

  it("caps the scroll step for far-away pointers", () => {
    const { scroller, scrollEl } = makeScroller();

    scroller.update(50, 5000);

    expect(scrollEl ? scrollEl.scrollTop - 100 : 0).toBeLessThanOrEqual(24);
    scroller.stop();
  });

  it("keeps scrolling on animation frames while the pointer stays outside", async () => {
    const { scroller, scrollEl } = makeScroller();

    scroller.update(50, 140);
    const afterFirst = scrollEl?.scrollTop ?? 0;

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(scrollEl?.scrollTop).toBeGreaterThan(afterFirst);
    scroller.stop();
  });

  it("stops the frame loop when the scroll position can no longer change", async () => {
    const maxTop = 100;
    let top = maxTop;
    const scrollEl = makeScrollElement();

    Object.defineProperty(scrollEl, "scrollTop", {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = Math.min(Math.max(value, 0), maxTop);
      },
    });

    const onStep = vi.fn();
    const scroller = new EdgeAutoScroller({
      getScrollElement: () => scrollEl as unknown as HTMLElement | null,
      onStep,
    });

    scroller.update(50, 140);

    const stepsAtLimit = onStep.mock.calls.length;

    expect(scrollEl.scrollTop).toBe(maxTop);

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(onStep.mock.calls.length).toBe(stepsAtLimit);
    scroller.stop();
  });

  it("stop() halts the frame loop", async () => {
    const { scroller, scrollEl } = makeScroller();

    scroller.update(50, 140);
    scroller.stop();
    const halted = scrollEl?.scrollTop ?? 0;

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(scrollEl?.scrollTop).toBe(halted);
  });

  it("does nothing when there is no scroll element", () => {
    const { scroller, onStep } = makeScroller(null);

    expect(() => scroller.update(50, 140)).not.toThrow();
    expect(onStep).not.toHaveBeenCalled();
  });
});
