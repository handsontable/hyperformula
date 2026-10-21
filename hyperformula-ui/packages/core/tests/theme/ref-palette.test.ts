import { describe, expect, it } from "vitest";
import {
  assignRefIndex,
  makeRefIndexMap,
  paletteColorForIndex,
  REF_PALETTE,
} from "../../src/theme/refPalette";

describe("REF_PALETTE", () => {
  it("has exactly 8 entries", () => {
    expect(REF_PALETTE).toHaveLength(8);
  });
});

describe("assignRefIndex", () => {
  it("returns the same index for repeated refs", () => {
    const map = makeRefIndexMap();
    assignRefIndex(map, "A1");
    expect(assignRefIndex(map, "A1")).toBe(0);
  });

  it("assigns indices in insertion order", () => {
    const map = makeRefIndexMap();
    expect(assignRefIndex(map, "A1")).toBe(0);
    expect(assignRefIndex(map, "B2")).toBe(1);
    expect(assignRefIndex(map, "C3")).toBe(2);
  });

  it("wraps via modulo when > 8 unique refs", () => {
    const map = makeRefIndexMap();
    for (let i = 0; i < 8; i++) {
      assignRefIndex(map, `ref-${i}`);
    }
    expect(assignRefIndex(map, "ref-8")).toBe(8);
    expect(paletteColorForIndex(8)).toBe(REF_PALETTE[0]);
  });
});

describe("assignRefIndex key normalization", () => {
  it("treats column letters case-insensitively", () => {
    const map = makeRefIndexMap();
    assignRefIndex(map, "A1");
    expect(assignRefIndex(map, "a1")).toBe(0);
  });

  it("treats sheet prefixes case-insensitively", () => {
    const map = makeRefIndexMap();
    assignRefIndex(map, "Sheet2!A1");
    expect(assignRefIndex(map, "sheet2!a1")).toBe(0);
  });

  it("treats named expressions case-insensitively", () => {
    const map = makeRefIndexMap();
    assignRefIndex(map, "MyName");
    expect(assignRefIndex(map, "MYNAME")).toBe(0);
  });

  it("keeps absolute and relative forms of the same cell distinct", () => {
    const map = makeRefIndexMap();
    assignRefIndex(map, "A1");
    expect(assignRefIndex(map, "$A$1")).toBe(1);
  });
});

describe("paletteColorForIndex", () => {
  it("wraps via modulo and returns a CSS var reference", () => {
    expect(paletteColorForIndex(0)).toBe("var(--hfe-ref-1)");
    expect(paletteColorForIndex(8)).toBe("var(--hfe-ref-1)");
    expect(paletteColorForIndex(1)).toBe("var(--hfe-ref-2)");
  });
});
