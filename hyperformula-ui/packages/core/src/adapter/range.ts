import type { RangeRefMeta } from "../lexer/types";
import type { CellAddress, CellRange, GridSelection, GridSize, HeaderPick } from "./types";

export function expandWholeRange(
  meta: RangeRefMeta,
  sheet: string,
  dimensions: { width: number; height: number },
): CellRange | null {
  if (meta.whole === "column") {
    return {
      start: { sheet, col: Math.min(meta.start.col, meta.end.col), row: 0 },
      end: { sheet, col: Math.max(meta.start.col, meta.end.col), row: dimensions.height - 1 },
    };
  }

  if (meta.whole === "row") {
    return {
      start: { sheet, col: 0, row: Math.min(meta.start.row, meta.end.row) },
      end: { sheet, col: dimensions.width - 1, row: Math.max(meta.start.row, meta.end.row) },
    };
  }

  return null;
}

export function isSingleCell(range: CellRange): boolean {
  return (
    range.start.sheet === range.end.sheet &&
    range.start.col === range.end.col &&
    range.start.row === range.end.row
  );
}

/**
 * Builds the normalized {@link CellRange} spanning two corners: `start` gets the minima,
 * `end` the maxima, regardless of drag direction.
 *
 * @category Utilities
 */
export function normalizeRange(start: CellAddress, end: CellAddress): CellRange {
  return {
    start: {
      sheet: start.sheet,
      col: Math.min(start.col, end.col),
      row: Math.min(start.row, end.row),
    },
    end: {
      sheet: start.sheet,
      col: Math.max(start.col, end.col),
      row: Math.max(start.row, end.row),
    },
  };
}

export function singleCellSelection(address: CellAddress): GridSelection {
  return { active: address, range: { start: address, end: address } };
}

/**
 * Expands a whole-row/column {@link HeaderPick} to the concrete cell range it covers in a
 * grid of `size`.
 *
 * @category Utilities
 */
export function expandHeaderSpan(pick: HeaderPick, size: GridSize): CellRange {
  if (pick.axis === "column") {
    const min = Math.min(pick.start, pick.end);
    const max = Math.max(pick.start, pick.end);

    return {
      start: { sheet: pick.sheet, col: min, row: 0 },
      end: { sheet: pick.sheet, col: max, row: size.rows - 1 },
    };
  }

  const min = Math.min(pick.start, pick.end);
  const max = Math.max(pick.start, pick.end);

  return {
    start: { sheet: pick.sheet, col: 0, row: min },
    end: { sheet: pick.sheet, col: size.cols - 1, row: max },
  };
}
