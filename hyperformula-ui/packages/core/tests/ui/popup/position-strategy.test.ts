import { describe, expect, it } from "vitest";
import {
  BottomViewportAnchoredStrategy,
  EndViewportAnchoredStrategy,
} from "../../../src/ui/popup/positionStrategy";

describe("BottomViewportAnchoredStrategy", () => {
  const strategy = new BottomViewportAnchoredStrategy();
  const viewport = { width: 1000, height: 800 };

  it("places popup below the anchor at the same left", () => {
    const anchor = { left: 100, top: 200, height: 20, width: 0, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(100);
    expect(position.top).toBe(220);
  });

  it("clamps left when popup overflows the right viewport edge", () => {
    const anchor = { left: 850, top: 200, height: 20, width: 0, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(788);
  });

  it("flips above the anchor when it doesn't fit below but fits above", () => {
    const anchor = { left: 100, top: 750, height: 20, width: 0, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.top).toBe(650);
    expect(position.maxHeight).toBeUndefined();
  });

  it("shrinks below when it doesn't fit either side but below has more space", () => {
    const anchor = { left: 100, top: 50, height: 20, width: 0, direction: "ltr" as const };
    const popupRect = { width: 200, height: 760 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.top).toBe(70);
    expect(position.maxHeight).toBe(718);
  });

  it("shrinks above when it doesn't fit either side but above has more space", () => {
    const anchor = { left: 100, top: 700, height: 50, width: 0, direction: "ltr" as const };
    const popupRect = { width: 200, height: 750 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.top).toBe(12);
    expect(position.maxHeight).toBe(688);
  });

  it("does not cap maxHeight when the popup already fits below the anchor", () => {
    const anchor = { left: 100, top: 0, height: 10, width: 0, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.top).toBe(10);
    expect(position.maxHeight).toBeUndefined();
  });

  it("aligns the popup's right edge to the anchor's right edge in RTL", () => {
    const anchor = { left: 400, top: 200, height: 20, width: 100, direction: "rtl" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(300);
    expect(position.top).toBe(220);
  });

  it("clamps left when the RTL popup overflows the left viewport edge", () => {
    const anchor = { left: 50, top: 200, height: 20, width: 40, direction: "rtl" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(12);
  });
});

describe("EndViewportAnchoredStrategy", () => {
  const strategy = new EndViewportAnchoredStrategy();
  const viewport = { width: 1000, height: 800 };

  it("places popup to the right of the anchor aligned to the anchor top", () => {
    const anchor = { left: 100, top: 200, height: 20, width: 80, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(180);
    expect(position.top).toBe(200);
  });

  it("flips to the left when popup overflows the right viewport edge", () => {
    const anchor = { left: 850, top: 200, height: 20, width: 80, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(650);
  });

  it("clamps left to 12 when flipped popup would overflow the left viewport edge", () => {
    const anchor = { left: 10, top: 200, height: 20, width: 995, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(12);
  });

  it("clamps top when popup overflows the bottom viewport edge", () => {
    const anchor = { left: 100, top: 750, height: 20, width: 80, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.top).toBe(688);
  });

  it("clamps top to 12 when popup would go above the viewport", () => {
    const anchor = { left: 100, top: 0, height: 10, width: 80, direction: "ltr" as const };
    const popupRect = { width: 200, height: 900 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.top).toBe(12);
  });

  it("opens to the left of the anchor in RTL", () => {
    const anchor = { left: 500, top: 200, height: 20, width: 40, direction: "rtl" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(300);
  });

  it("flips to the right of the anchor when the RTL popup overflows the left edge", () => {
    const anchor = { left: 100, top: 200, height: 20, width: 40, direction: "rtl" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(140);
  });

  it("clamps the RTL-flipped popup back inside the right viewport edge", () => {
    const anchor = { left: 100, top: 200, height: 20, width: 40, direction: "rtl" as const };
    const popupRect = { width: 900, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport);

    expect(position.left).toBe(88);
  });

  it("clamps the RTL-flipped popup back inside the bounds right edge", () => {
    const bounds = { left: 0, top: 0, right: 500, bottom: 700 };
    const anchor = { left: 100, top: 200, height: 20, width: 40, direction: "rtl" as const };
    const popupRect = { width: 400, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport, bounds);

    expect(position.left).toBe(88);
  });

  it("caps maxWidth so a popup wider than the bounds stays inside them", () => {
    const bounds = { left: 100, top: 100, right: 400, bottom: 700 };
    const anchor = { left: 150, top: 200, height: 20, width: 80, direction: "ltr" as const };
    const popupRect = { width: 500, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport, bounds);

    expect(position.left).toBe(112);
    expect(position.maxWidth).toBe(276);
  });

  it("caps maxHeight so a popup taller than the bounds stays inside them", () => {
    const bounds = { left: 100, top: 100, right: 900, bottom: 300 };
    const anchor = { left: 150, top: 200, height: 20, width: 80, direction: "ltr" as const };
    const popupRect = { width: 200, height: 500 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport, bounds);

    expect(position.top).toBe(112);
    expect(position.maxHeight).toBe(176);
  });

  it("leaves maxWidth and maxHeight unset when the popup fits inside the bounds", () => {
    const bounds = { left: 100, top: 100, right: 900, bottom: 700 };
    const anchor = { left: 150, top: 200, height: 20, width: 80, direction: "ltr" as const };
    const popupRect = { width: 200, height: 100 } as DOMRect;

    const position = strategy.compute(anchor, popupRect, viewport, bounds);

    expect(position.maxWidth).toBeUndefined();
    expect(position.maxHeight).toBeUndefined();
  });
});
