/**
 * Which host pane a highlight piece belongs to, per the frozen-row/column split.
 *
 * @category Highlighting
 */
export type HighlightLayerKind = "scroll" | "frozenRow" | "frozenCol" | "corner";

/**
 * Tells whether a row or column index is frozen in the host grid.
 *
 * @category Highlighting
 */
export type FrozenPredicate = (index: number) => boolean;

/**
 * One cell's pixel rect plus its grid coordinates — the input to {@link groupCellsIntoRuns}.
 *
 * @category Highlighting
 */
export interface CellRect {
  row: number;
  col: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A merged rectangle of adjacent cells, tagged with the pane it renders into.
 *
 * @category Highlighting
 */
export interface CellRun {
  layer: HighlightLayerKind;
  left: number;
  top: number;
  width: number;
  height: number;
}

const ADJACENCY_TOLERANCE = 1;

/**
 * Assigns a cell to its {@link HighlightLayerKind} pane from the two frozen predicates.
 *
 * @category Highlighting
 */
export function classifyCellLayer(
  row: number,
  col: number,
  isRowFrozen: FrozenPredicate,
  isColFrozen: FrozenPredicate,
): HighlightLayerKind {
  const frozenRow = isRowFrozen(row);
  const frozenCol = isColFrozen(col);

  if (frozenRow && frozenCol) {
    return "corner";
  }

  if (frozenRow) {
    return "frozenRow";
  }

  if (frozenCol) {
    return "frozenCol";
  }

  return "scroll";
}

interface ClassifiedRect extends CellRect {
  layer: HighlightLayerKind;
}

function mergeHorizontally(cells: ClassifiedRect[]): CellRun[] {
  const byBand = new Map<string, ClassifiedRect[]>();

  for (const cell of cells) {
    const key = `${cell.layer}:${Math.round(cell.top)}`;
    const band = byBand.get(key);

    if (band) {
      band.push(cell);
    } else {
      byBand.set(key, [cell]);
    }
  }

  const runs: CellRun[] = [];

  for (const band of byBand.values()) {
    band.sort((a, b) => a.left - b.left);

    let current: CellRun | null = null;

    for (const cell of band) {
      if (current && cell.left - (current.left + current.width) <= ADJACENCY_TOLERANCE) {
        current.width = Math.max(current.width, cell.left + cell.width - current.left);
        current.height = Math.max(current.height, cell.height);
        continue;
      }

      current = {
        layer: cell.layer,
        left: cell.left,
        top: cell.top,
        width: cell.width,
        height: cell.height,
      };
      runs.push(current);
    }
  }

  return runs;
}

function mergeVertically(runs: CellRun[]): CellRun[] {
  const byColumnBand = new Map<string, CellRun[]>();

  for (const run of runs) {
    const key = `${run.layer}:${Math.round(run.left)}:${Math.round(run.width)}`;
    const band = byColumnBand.get(key);

    if (band) {
      band.push(run);
    } else {
      byColumnBand.set(key, [run]);
    }
  }

  const merged: CellRun[] = [];

  for (const band of byColumnBand.values()) {
    band.sort((a, b) => a.top - b.top);

    let current: CellRun | null = null;

    for (const run of band) {
      if (current && run.top - (current.top + current.height) <= ADJACENCY_TOLERANCE) {
        current.height = Math.max(current.height, run.top + run.height - current.top);
        continue;
      }

      current = { ...run };
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Merges per-cell rects into the fewest {@link CellRun}s: classifies each cell into a pane,
 * then joins adjacent cells horizontally and vertically.
 *
 * @category Highlighting
 */
export function groupCellsIntoRuns(
  cells: CellRect[],
  isRowFrozen: FrozenPredicate,
  isColFrozen: FrozenPredicate,
): CellRun[] {
  const classified = cells.map((cell) => ({
    ...cell,
    layer: classifyCellLayer(cell.row, cell.col, isRowFrozen, isColFrozen),
  }));

  return mergeVertically(mergeHorizontally(classified));
}
