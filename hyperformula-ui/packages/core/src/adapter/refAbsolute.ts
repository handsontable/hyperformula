const CELL_PATTERN = /^(\$?)([A-Za-z]+)(\$?)(\d+)$/;

function nextState(absCol: boolean, absRow: boolean): { absCol: boolean; absRow: boolean } {
  if (!absCol && !absRow) {
    return { absCol: true, absRow: true };
  }

  if (absCol && absRow) {
    return { absCol: false, absRow: true };
  }

  if (!absCol && absRow) {
    return { absCol: true, absRow: false };
  }

  return { absCol: false, absRow: false };
}

function cycleCell(cell: string, state: { absCol: boolean; absRow: boolean }): string | null {
  const match = CELL_PATTERN.exec(cell);

  if (!match) {
    return null;
  }

  const colDollar = state.absCol ? "$" : "";
  const rowDollar = state.absRow ? "$" : "";

  return `${colDollar}${match[2]}${rowDollar}${match[4]}`;
}

function splitSheet(ref: string): { prefix: string; body: string } {
  const bang = ref.lastIndexOf("!");

  if (bang === -1) {
    return { prefix: "", body: ref };
  }

  return { prefix: ref.slice(0, bang + 1), body: ref.slice(bang + 1) };
}

export function cycleRefAbsolute(a1: string): string {
  const { prefix, body } = splitSheet(a1);
  const [startCell, endCell] = body.split(":");
  const startMatch = CELL_PATTERN.exec(startCell ?? "");

  if (!startMatch) {
    return a1;
  }

  const currentState = { absCol: startMatch[1] === "$", absRow: startMatch[3] === "$" };
  const advanced = nextState(currentState.absCol, currentState.absRow);
  const nextStart = cycleCell(startCell ?? "", advanced);

  if (nextStart === null) {
    return a1;
  }

  if (endCell === undefined) {
    return `${prefix}${nextStart}`;
  }

  const nextEnd = cycleCell(endCell, advanced);

  if (nextEnd === null) {
    return a1;
  }

  return `${prefix}${nextStart}:${nextEnd}`;
}
