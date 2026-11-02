import type { CellRange, RangeRect } from "./types";

/**
 * Returns the bounding {@link RangeRect} of two cell elements relative to `host` (including
 * its scroll offset), or `null` when either element is missing.
 *
 * @category Utilities
 */
export function unionRectRelativeTo(
  host: HTMLElement,
  startEl: Element | null,
  endEl: Element | null,
): RangeRect | null {
  if (!startEl || !endEl) {
    return null;
  }

  const hostRect = host.getBoundingClientRect();
  const startRect = startEl.getBoundingClientRect();
  const endRect = endEl.getBoundingClientRect();

  return {
    left: Math.min(startRect.left, endRect.left) - hostRect.left + host.scrollLeft,
    top: Math.min(startRect.top, endRect.top) - hostRect.top + host.scrollTop,
    width: Math.max(startRect.right, endRect.right) - Math.min(startRect.left, endRect.left),
    height: Math.max(startRect.bottom, endRect.bottom) - Math.min(startRect.top, endRect.top),
  };
}

function bands(
  low: number,
  high: number,
  head: number,
  tail: number,
  total: number,
): [number, number][] {
  if (head <= 0 && tail <= 0) {
    return [[low, high]];
  }

  const result: [number, number][] = [];
  const tailStart = tail > 0 ? Math.max(total - tail, head) : high + 1;

  if (head > 0 && low <= head - 1) {
    result.push([low, Math.min(high, head - 1)]);
  }

  const middleLow = head > 0 ? Math.max(low, head) : low;
  const middleHigh = Math.min(high, tailStart - 1);

  if (middleLow <= middleHigh) {
    result.push([middleLow, middleHigh]);
  }

  if (tail > 0 && high >= tailStart) {
    result.push([Math.max(low, tailStart), high]);
  }

  return result;
}

/**
 * Splits a range into per-pane pieces along frozen row/column boundaries (top, bottom, and
 * left panes), so each piece can be drawn inside its own overlay pane.
 *
 * @category Utilities
 */
export function splitRangeByFrozen(
  range: CellRange,
  frozenRows: number,
  frozenCols: number,
  frozenRowsBottom = 0,
  totalRows = 0,
): CellRange[] {
  const startRow = Math.min(range.start.row, range.end.row);
  const endRow = Math.max(range.start.row, range.end.row);
  const startCol = Math.min(range.start.col, range.end.col);
  const endCol = Math.max(range.start.col, range.end.col);
  const { sheet } = range.start;

  const pieces: CellRange[] = [];

  for (const [rowLow, rowHigh] of bands(
    startRow,
    endRow,
    frozenRows,
    frozenRowsBottom,
    totalRows,
  )) {
    for (const [colLow, colHigh] of bands(startCol, endCol, frozenCols, 0, 0)) {
      pieces.push({
        start: { sheet, row: rowLow, col: colLow },
        end: { sheet, row: rowHigh, col: colHigh },
      });
    }
  }

  return pieces;
}
