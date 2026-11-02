import { describe, expect, it } from "vitest";
import {
  type CellRect,
  classifyCellLayer,
  groupCellsIntoRuns,
} from "../../../src/ui/highlight/cellRuns";

const never = (): boolean => false;

function makeCell(row: number, col: number, overrides: Partial<CellRect> = {}): CellRect {
  return {
    row,
    col,
    left: col * 100,
    top: row * 30,
    width: 100,
    height: 30,
    ...overrides,
  };
}

describe("classifyCellLayer", () => {
  it("classifies by frozen predicates", () => {
    const isRowFrozen = (row: number): boolean => row === 0;
    const isColFrozen = (col: number): boolean => col === 2;

    expect(classifyCellLayer(5, 1, isRowFrozen, isColFrozen)).toBe("scroll");
    expect(classifyCellLayer(0, 1, isRowFrozen, isColFrozen)).toBe("frozenRow");
    expect(classifyCellLayer(5, 2, isRowFrozen, isColFrozen)).toBe("frozenCol");
    expect(classifyCellLayer(0, 2, isRowFrozen, isColFrozen)).toBe("corner");
  });

  it("classifies a middle pinned column as frozen", () => {
    const isColFrozen = (col: number): boolean => col === 3;

    expect(classifyCellLayer(1, 3, never, isColFrozen)).toBe("frozenCol");
    expect(classifyCellLayer(1, 0, never, isColFrozen)).toBe("scroll");
  });
});

describe("groupCellsIntoRuns", () => {
  it("merges a full grid block into one run", () => {
    const cells = [makeCell(0, 0), makeCell(0, 1), makeCell(1, 0), makeCell(1, 1)];
    const runs = groupCellsIntoRuns(cells, never, never);

    expect(runs).toEqual([{ layer: "scroll", left: 0, top: 0, width: 200, height: 60 }]);
  });

  it("keeps separate runs when a hidden column leaves a horizontal gap", () => {
    const cells = [makeCell(0, 0), makeCell(0, 2, { left: 250 })];
    const runs = groupCellsIntoRuns(cells, never, never);

    expect(runs).toHaveLength(2);
    expect(runs[0]).toMatchObject({ left: 0, width: 100 });
    expect(runs[1]).toMatchObject({ left: 250, width: 100 });
  });

  it("splits runs by layer even when cells are pixel-adjacent", () => {
    const isColFrozen = (col: number): boolean => col === 0;
    const cells = [makeCell(0, 0), makeCell(0, 1)];
    const runs = groupCellsIntoRuns(cells, never, isColFrozen);

    expect(runs).toHaveLength(2);
    expect(runs.find((run) => run.layer === "frozenCol")).toMatchObject({ left: 0, width: 100 });
    expect(runs.find((run) => run.layer === "scroll")).toMatchObject({ left: 100, width: 100 });
  });

  it("does not merge vertically when widths differ", () => {
    const cells = [makeCell(0, 0, { width: 100 }), makeCell(1, 0, { width: 120 })];
    const runs = groupCellsIntoRuns(cells, never, never);

    expect(runs).toHaveLength(2);
  });

  it("returns empty for no cells", () => {
    expect(groupCellsIntoRuns([], never, never)).toEqual([]);
  });
});
