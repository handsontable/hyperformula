import type { CellAddress, Direction, GridSize } from "./types";

/**
 * Clamped single-step move from `from` in `direction`, staying inside `size`.
 *
 * @category Utilities
 */
export function stepCell(from: CellAddress, direction: Direction, size: GridSize): CellAddress {
  const { rows, cols } = size;

  if (rows <= 0 || cols <= 0) {
    return from;
  }

  const delta = direction === "up" || direction === "left" ? -1 : 1;

  if (direction === "up" || direction === "down") {
    return {
      sheet: from.sheet,
      col: from.col,
      row: Math.min(Math.max(from.row + delta, 0), rows - 1),
    };
  }

  return {
    sheet: from.sheet,
    col: Math.min(Math.max(from.col + delta, 0), cols - 1),
    row: from.row,
  };
}

/**
 * Parses raw cell input into its stored form: numeric text becomes a `number`; formulas
 * (leading `=`) and everything else stay strings.
 *
 * @category Utilities
 */
export function parseCellInput(raw: string): number | string {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return "";
  }

  if (trimmed.startsWith("=")) {
    return trimmed;
  }

  if (/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function asError(value: unknown): { value?: string; type?: string } | null {
  if (typeof value === "object" && value !== null && "type" in (value as object)) {
    return value as { value?: string; type?: string };
  }

  return null;
}

/**
 * Formats a computed cell value for display: engine error objects render as `#…` codes,
 * non-integer numbers round to four decimals, `null`/`undefined` render empty.
 *
 * @category Utilities
 */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const errorValue = asError(value);

  if (errorValue) {
    return errorValue.value ?? `#${errorValue.type ?? "ERROR"}`;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
  }

  return String(value);
}

/**
 * Walks from `from` in `direction` to the edge of the contiguous data block —
 * ctrl+arrow-style navigation. The caller supplies `hasData` in its own coordinate space.
 *
 * @category Utilities
 */
export function findDataEdge(
  from: CellAddress,
  direction: Direction,
  size: GridSize,
  hasData: (row: number, col: number) => boolean,
): CellAddress {
  const { rows, cols } = size;

  if (rows <= 0 || cols <= 0 || from.row < 0 || from.col < 0) {
    return from;
  }

  const movesAlongRows = direction === "up" || direction === "down";
  const delta = direction === "up" || direction === "left" ? -1 : 1;
  const maxRow = rows - 1;
  const maxCol = cols - 1;
  let row = from.row;
  let col = from.col;

  if (movesAlongRows) {
    while (row + delta >= 0 && row + delta <= maxRow && hasData(row + delta, col)) {
      row += delta;
    }

    if (row === from.row) {
      row = Math.min(Math.max(row + delta, 0), maxRow);
    }
  } else {
    while (col + delta >= 0 && col + delta <= maxCol && hasData(row, col + delta)) {
      col += delta;
    }

    if (col === from.col) {
      col = Math.min(Math.max(col + delta, 0), maxCol);
    }
  }

  return { sheet: from.sheet, row, col };
}
