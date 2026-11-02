import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CellRange,
  GridGeometry,
  RangeHighlight,
  RangeRect,
} from "../../../src/adapter/types";
import {
  EPHEMERAL_COLOR,
  fillColor,
  HighlightLayer,
} from "../../../src/ui/highlight/highlightLayer";
import { nextFrame } from "../../helpers";

function range(startRow: number, startCol: number, endRow: number, endCol: number): CellRange {
  return {
    start: { sheet: "", row: startRow, col: startCol },
    end: { sheet: "", row: endRow, col: endCol },
  };
}

const RECT: RangeRect = { left: 10, top: 20, width: 30, height: 40 };

class FakeGeometry implements GridGeometry {
  host = document.createElement("div");
  rectsFor: (range: CellRange) => RangeRect[] = () => [RECT];
  viewportCb: (() => void) | null = null;
  getColHeaderEl?: (col: number) => HTMLElement | null;
  getRowHeaderEl?: (row: number) => HTMLElement | null;
  getViewportClip?: () => RangeRect | null;

  getOverlayHost(): HTMLElement {
    return this.host;
  }
  getRangeRects(range: CellRange): RangeRect[] {
    return this.rectsFor(range);
  }
  onViewportChange(callback: () => void): () => void {
    this.viewportCb = callback;

    return () => {
      this.viewportCb = null;
    };
  }
}

function divs(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>(".hfe-highlight__item"));
}

describe("HighlightLayer", () => {
  let geometry: FakeGeometry;
  let layer: HighlightLayer;

  beforeEach(() => {
    geometry = new FakeGeometry();
    layer = new HighlightLayer(geometry);
  });

  it("creates one div per persistent highlight rect", () => {
    layer.setHighlights([
      { range: range(0, 0, 0, 0), color: "hsl(10 75% 55%)", fill: false },
      { range: range(1, 1, 2, 2), color: "hsl(20 75% 55%)", fill: false },
    ]);
    expect(divs(geometry.host)).toHaveLength(2);
  });

  it("creates a div per rect when a range splits into several rects", () => {
    geometry.rectsFor = () => [RECT, RECT, RECT];
    layer.setHighlights([{ range: range(0, 0, 5, 5), color: "c1" }]);
    expect(divs(geometry.host)).toHaveLength(3);
  });

  it("shrinks the div pool when fewer highlights are set", () => {
    layer.setHighlights([
      { range: range(0, 0, 0, 0), color: "c1" },
      { range: range(1, 1, 1, 1), color: "c2" },
      { range: range(2, 2, 2, 2), color: "c3" },
    ]);
    expect(divs(geometry.host)).toHaveLength(3);
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    expect(divs(geometry.host)).toHaveLength(1);
  });

  it("lowers opacity for the fill color", () => {
    expect(fillColor("hsl(120 75% 55% / 0.95)")).toBe("hsl(120 75% 55% / 0.12)");
    expect(fillColor("hsl(200 80% 50%)")).toBe("hsl(200 80% 50% / 0.12)");
    expect(fillColor("hsl(210 80% 55%  /  0.9)")).toBe("hsl(210 80% 55% / 0.12)");
  });

  it("leaves a malformed hsl color unchanged", () => {
    expect(fillColor("hsl(210 80% 55% / x)")).toBe("hsl(210 80% 55% / x)");
    expect(fillColor("hsl((   ")).toBe("hsl((   ");
  });

  it("uses color-mix for CSS var references", () => {
    expect(fillColor("var(--hfe-ref-1)")).toBe(
      "color-mix(in srgb, var(--hfe-ref-1) calc(var(--hfe-selection-opacity) * 100%), transparent)",
    );
  });

  it("makes outline-only highlights transparent", () => {
    layer.setHighlights([
      { range: range(0, 0, 0, 0), color: "hsl(120 75% 55% / 0.95)", fill: true },
      { range: range(1, 1, 1, 1), color: "hsl(120 75% 55% / 0.95)", fill: false },
    ]);
    const [filled, outlined] = divs(geometry.host);

    expect(filled?.style.backgroundColor).not.toBe("transparent");
    expect(outlined?.style.backgroundColor).toBe("transparent");
  });

  it("omits divs for a highlight whose range yields no rects", () => {
    geometry.rectsFor = (queried) => (queried.start.row === 99 ? [] : [RECT]);
    layer.setHighlights([
      { range: range(0, 0, 0, 0), color: "c1" },
      { range: range(99, 0, 99, 0), color: "c2" },
    ]);
    const rendered = divs(geometry.host);

    expect(rendered).toHaveLength(1);
    expect(rendered[0]?.style.left).toBe("10px");
  });

  it("uses one div per ephemeral rect and removes them when cleared", () => {
    layer.setEphemeral(range(0, 0, 0, 0));
    layer.setEphemeral(range(1, 1, 2, 2));
    expect(divs(geometry.host)).toHaveLength(1);
    layer.setEphemeral(null);
    expect(divs(geometry.host)).toHaveLength(0);
  });

  it("does not recompute persistent-highlight rects when only the ephemeral changes", () => {
    const getRangeRectsSpy = vi.spyOn(geometry, "getRangeRects");

    layer.setHighlights([
      { range: range(0, 0, 0, 0), color: "c1" },
      { range: range(1, 1, 1, 1), color: "c2" },
    ]);
    getRangeRectsSpy.mockClear();

    layer.setEphemeral(range(2, 2, 3, 3));
    layer.setEphemeral(range(2, 2, 4, 4));
    layer.setEphemeral(null);

    const persistentCalls = getRangeRectsSpy.mock.calls.filter(
      ([queried]) => queried.start.row === 0 || queried.start.row === 1,
    );

    expect(persistentCalls).toHaveLength(0);
    expect(divs(geometry.host)).toHaveLength(2);
  });

  it("repositions on viewport change", async () => {
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    expect(divs(geometry.host)[0]?.style.left).toBe("10px");
    geometry.rectsFor = () => [{ left: 99, top: 0, width: 5, height: 5 }];
    geometry.viewportCb?.();
    await nextFrame();
    expect(divs(geometry.host)[0]?.style.left).toBe("99px");
  });

  it("clears persistent and ephemeral on clear()", () => {
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    layer.setEphemeral(range(1, 1, 1, 1));
    layer.clear();
    expect(divs(geometry.host)).toHaveLength(0);
  });

  it("removes all divs and unsubscribes on destroy", () => {
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    layer.destroy();
    expect(divs(geometry.host)).toHaveLength(0);
    expect(geometry.viewportCb).toBeNull();
  });
});

describe("HighlightLayer setClassName", () => {
  let geometry: FakeGeometry;
  let layer: HighlightLayer;

  beforeEach(() => {
    geometry = new FakeGeometry();
    layer = new HighlightLayer(geometry);
  });

  function group(): HTMLElement | null {
    return geometry.host.querySelector(".hfe-highlight");
  }

  it("adds the class to already-rendered group elements", () => {
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    layer.setClassName("my-theme");

    expect(group()?.classList.contains("my-theme")).toBe(true);
  });

  it("removes the class when called with null", () => {
    layer.setClassName("my-theme");
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    layer.setClassName(null);

    expect(group()?.classList.contains("my-theme")).toBe(false);
  });

  it("replaces a previously set class", () => {
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    layer.setClassName("theme-a");
    layer.setClassName("theme-b");

    expect(group()?.classList.contains("theme-a")).toBe(false);
    expect(group()?.classList.contains("theme-b")).toBe(true);
  });

  it("applies the class to zIndex layer groups", () => {
    geometry.rectsFor = () => [{ ...RECT, zIndex: 5 }];
    layer.setClassName("my-theme");
    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    const groups = Array.from(geometry.host.querySelectorAll<HTMLElement>(".hfe-highlight"));

    expect(groups).toHaveLength(1);
    expect(groups[0]?.classList.contains("my-theme")).toBe(true);
  });
});

describe("HighlightLayer header highlights", () => {
  it("styles a col header element when whole=column", () => {
    const geo = new FakeGeometry();
    const colHeader = document.createElement("th");
    geo.getColHeaderEl = (col) => (col === 1 ? colHeader : null);
    const layer = new HighlightLayer(geo);

    layer.setHighlights([{ range: range(0, 1, 9, 1), color: "red", whole: "column" }]);

    expect(colHeader.style.backgroundColor).not.toBe("");
  });

  it("clears header styles when clear() is called", () => {
    const geo = new FakeGeometry();
    const colHeader = document.createElement("th");
    geo.getColHeaderEl = (col) => (col === 0 ? colHeader : null);
    const layer = new HighlightLayer(geo);

    layer.setHighlights([{ range: range(0, 0, 9, 0), color: "red", whole: "column" }]);
    layer.clear();

    expect(colHeader.style.backgroundColor).toBe("");
  });

  it("rerenderHeaders() re-applies styles when the element appears later", () => {
    const geo = new FakeGeometry();
    const colHeader = document.createElement("th");
    let resolvedEl: HTMLElement | null = null;
    geo.getColHeaderEl = () => resolvedEl;
    const layer = new HighlightLayer(geo);

    layer.setHighlights([{ range: range(0, 0, 9, 0), color: "red", whole: "column" }]);
    expect(colHeader.style.backgroundColor).toBe("");

    resolvedEl = colHeader;
    layer.rerenderHeaders();

    expect(colHeader.style.backgroundColor).not.toBe("");
  });

  it("does not throw when geometry has no header methods", () => {
    const geo = new FakeGeometry();
    const layer = new HighlightLayer(geo);

    expect(() =>
      layer.setHighlights([{ range: range(0, 0, 9, 0), color: "red", whole: "column" }]),
    ).not.toThrow();
  });
});

describe("a11y", () => {
  it("hides highlight elements from assistive technology", () => {
    const geometry = new FakeGeometry();
    const layer = new HighlightLayer(geometry);

    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);

    for (const element of Array.from(geometry.host.children)) {
      expect(element.getAttribute("aria-hidden")).toBe("true");
    }
  });
});

describe("onRender", () => {
  it("fires with persistent and ephemeral state on each mutation", () => {
    const geometry = new FakeGeometry();
    const calls: Array<{ persistent: RangeHighlight[]; ephemeral: RangeHighlight | null }> = [];
    const layer = new HighlightLayer(geometry, {
      onRender: (persistent, ephemeral) => calls.push({ persistent, ephemeral }),
    });

    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    layer.setEphemeral(range(1, 1, 2, 2), "c2");

    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual({
      persistent: [{ range: range(0, 0, 0, 0), color: "c1" }],
      ephemeral: null,
    });
    expect(calls[1]).toEqual({
      persistent: [{ range: range(0, 0, 0, 0), color: "c1" }],
      ephemeral: { range: range(1, 1, 2, 2), color: "c2" },
    });
  });

  it("resolves the default ephemeral color before notifying", () => {
    const geometry = new FakeGeometry();
    const calls: Array<RangeHighlight | null> = [];
    const layer = new HighlightLayer(geometry, {
      onRender: (_persistent, ephemeral) => calls.push(ephemeral),
    });

    layer.setEphemeral(range(0, 0, 0, 0));

    expect(calls[0]).toEqual({ range: range(0, 0, 0, 0), color: EPHEMERAL_COLOR });
  });

  it("fires with cleared state on clear()", () => {
    const geometry = new FakeGeometry();
    const calls: Array<{ persistent: RangeHighlight[]; ephemeral: RangeHighlight | null }> = [];
    const layer = new HighlightLayer(geometry, {
      onRender: (persistent, ephemeral) => calls.push({ persistent, ephemeral }),
    });

    layer.setEphemeral(range(0, 0, 0, 0), "c1");
    layer.clear();

    expect(calls[1]).toEqual({ persistent: [], ephemeral: null });
  });

  it("does not read the viewport clip on a render pass with no groups", () => {
    const geometry = new FakeGeometry();
    const clipSpy = vi.fn((): RangeRect | null => null);

    geometry.getViewportClip = clipSpy;

    const layer = new HighlightLayer(geometry);

    layer.clear();
    expect(clipSpy).not.toHaveBeenCalled();

    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    clipSpy.mockClear();
    layer.clear();

    expect(clipSpy).not.toHaveBeenCalled();
  });

  it("recomputes persistent rects when a viewport reposition is still pending", async () => {
    const geometry = new FakeGeometry();
    const layer = new HighlightLayer(geometry);

    layer.setHighlights([{ range: range(0, 0, 0, 0), color: "c1" }]);
    geometry.rectsFor = () => [{ left: 99, top: 0, width: 5, height: 5 }];
    geometry.viewportCb?.();

    const getRangeRectsSpy = vi.spyOn(geometry, "getRangeRects");

    layer.setEphemeral(range(1, 1, 1, 1));

    const persistentCalls = getRangeRectsSpy.mock.calls.filter(
      ([queried]) => queried.start.row === 0,
    );

    expect(persistentCalls.length).toBeGreaterThan(0);
    expect(divs(geometry.host)[0]?.style.left).toBe("99px");

    getRangeRectsSpy.mockClear();
    await nextFrame();

    expect(getRangeRectsSpy).not.toHaveBeenCalled();
  });

  it("destroy() cancels a pending viewport reposition frame", () => {
    const geometry = new FakeGeometry();
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(42);
    const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});
    const layer = new HighlightLayer(geometry);

    geometry.viewportCb?.();
    layer.destroy();

    expect(cancelSpy).toHaveBeenCalledWith(42);
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});
