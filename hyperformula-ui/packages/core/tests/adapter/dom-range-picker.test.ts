import { afterEach, describe, expect, it, vi } from "vitest";
import { DomRangePicker, type DomRangePickerOptions } from "../../src/adapter/domRangePicker";
import type {
  CellAddress,
  CellPick,
  CellRange,
  GridSize,
  HeaderPick,
} from "../../src/adapter/types";
import { EventManager } from "../../src/events/eventManager";
import { CN } from "../../src/theme/classNames";

const SHEET = "Sheet1";
const EPHEMERAL_COLOR = "#00aaff";
const GRID_ROWS = 4;
const GRID_COLS = 4;
const CELL_SELECTOR = ".grid-cell";
const HEADER_SELECTOR = "[data-header-col]";
const ROW_HEADER_SELECTOR = "[data-header-row]";

interface EphemeralCall {
  range: CellRange | null;
  color: string | undefined;
}

interface HarnessOptions {
  resolveAddress?: (cell: HTMLElement) => { row: number; col: number } | null;
  omitResolver?: boolean;
  refModeClass?: string;
  getScrollElement?: () => HTMLElement | null;
  withHeaders?: boolean;
  withRowHeaders?: boolean;
  getGridSize?: () => GridSize;
}

interface PickerHarness {
  picker: DomRangePicker;
  root: HTMLElement;
  ephemeralCalls: EphemeralCall[];
  cellPicks: CellAddress[];
  rangePicks: CellRange[];
  cellPickPayloads: CellPick[];
  outsideClicks: CellAddress[];
  headerPicks: HeaderPick[];
  cellAt(row: number, col: number): HTMLElement;
  colHeaderAt(col: number): HTMLElement;
  rowHeaderAt(row: number): HTMLElement;
}

const cleanupTasks: (() => void)[] = [];

function buildGrid(): HTMLElement {
  const root = document.createElement("div");

  for (let i = 0; i < GRID_ROWS; i++) {
    for (let j = 0; j < GRID_COLS; j++) {
      const cell = document.createElement("div");

      cell.className = "grid-cell";
      cell.dataset.row = String(i);
      cell.dataset.col = String(j);
      root.appendChild(cell);
    }
  }

  document.body.appendChild(root);

  return root;
}

function buildColumnHeaders(root: HTMLElement): void {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  for (let col = 0; col < GRID_COLS; col++) {
    const headerCell = document.createElement("th");

    headerCell.dataset.headerCol = String(col);
    headerRow.appendChild(headerCell);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);
  root.appendChild(table);
}

function resolveColumnHeader(headerEl: HTMLElement): { axis: "column"; index: number } | null {
  const col = Number(headerEl.dataset.headerCol);

  if (Number.isNaN(col)) {
    return null;
  }

  return { axis: "column", index: col };
}

function buildRowHeaders(root: HTMLElement): void {
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  for (let row = 0; row < GRID_ROWS; row++) {
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("th");

    headerCell.dataset.headerRow = String(row);
    headerRow.appendChild(headerCell);
    tbody.appendChild(headerRow);
  }

  table.appendChild(tbody);
  root.appendChild(table);
}

function resolveRowHeader(headerEl: HTMLElement): { axis: "row"; index: number } | null {
  const row = Number(headerEl.dataset.headerRow);

  if (Number.isNaN(row)) {
    return null;
  }

  return { axis: "row", index: row };
}

function resolveFromDataset(cell: HTMLElement): { row: number; col: number } | null {
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  if (Number.isNaN(row) || Number.isNaN(col)) {
    return null;
  }

  return { row, col };
}

function createPicker(options: HarnessOptions = {}): PickerHarness {
  const root = buildGrid();
  const ephemeralCalls: EphemeralCall[] = [];
  const layerStub = {
    setEphemeral(range: CellRange | null, color?: string): void {
      ephemeralCalls.push({ range, color });
    },
  };
  const events = new EventManager();
  const pickerOptions: DomRangePickerOptions = {
    root,
    cellSelector: CELL_SELECTOR,
    sheet: SHEET,
    layer: layerStub,
    ephemeralColor: EPHEMERAL_COLOR,
    scope: events.createScope("range-pick-tests"),
  };

  if (!options.omitResolver) {
    pickerOptions.resolveAddress = options.resolveAddress ?? resolveFromDataset;
  }

  if (options.refModeClass) {
    pickerOptions.refModeClass = options.refModeClass;
  }

  if (options.getScrollElement) {
    pickerOptions.getScrollElement = options.getScrollElement;
  }

  if (options.withHeaders) {
    buildColumnHeaders(root);
    pickerOptions.headerSelector = HEADER_SELECTOR;
    pickerOptions.resolveHeader = resolveColumnHeader;
  }

  if (options.withRowHeaders) {
    buildRowHeaders(root);
    pickerOptions.headerSelector = ROW_HEADER_SELECTOR;
    pickerOptions.resolveHeader = resolveRowHeader;
  }

  if (options.getGridSize) {
    pickerOptions.getGridSize = options.getGridSize;
  }

  const picker = new DomRangePicker(pickerOptions);
  const cellPicks: CellAddress[] = [];
  const rangePicks: CellRange[] = [];
  const cellPickPayloads: CellPick[] = [];
  const outsideClicks: CellAddress[] = [];
  const headerPicks: HeaderPick[] = [];

  picker.onCellPick((pick) => {
    cellPicks.push(pick.ref);
    cellPickPayloads.push(pick);
  });
  picker.onRangePick((pick) => {
    rangePicks.push(pick.ref);
  });
  picker.onOutsideCellClick((address) => {
    outsideClicks.push(address);
  });
  picker.onHeaderPick((pick) => {
    headerPicks.push(pick);
  });
  cleanupTasks.push(() => picker.destroy());

  return {
    picker,
    root,
    ephemeralCalls,
    cellPicks,
    rangePicks,
    cellPickPayloads,
    outsideClicks,
    headerPicks,
    cellAt: (row, col) => {
      const cell = root.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`);

      if (!cell) {
        throw new Error(`expected cell at row ${row}, col ${col}`);
      }

      return cell;
    },
    colHeaderAt: (col) => {
      const header = root.querySelector<HTMLElement>(`[data-header-col="${col}"]`);

      if (!header) {
        throw new Error(`expected column header at col ${col}`);
      }

      return header;
    },
    rowHeaderAt: (row) => {
      const header = root.querySelector<HTMLElement>(`[data-header-row="${row}"]`);

      if (!header) {
        throw new Error(`expected row header at row ${row}`);
      }

      return header;
    },
  };
}

function addressOf(row: number, col: number): CellAddress {
  return { sheet: SHEET, col, row };
}

function pressOn(target: EventTarget, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true, ...init });

  target.dispatchEvent(event);

  return event;
}

function moveOver(target: EventTarget): void {
  target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, buttons: 1 }));
}

function release(): void {
  document.dispatchEvent(new MouseEvent("mouseup"));
}

afterEach(() => {
  for (const cleanup of cleanupTasks) {
    cleanup();
  }

  cleanupTasks.length = 0;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("DomRangePicker", () => {
  it("resolves a ctrl-click on a cell to a cell pick", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(1, 2), { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([addressOf(1, 2)]);
    expect(harness.rangePicks).toEqual([]);
  });

  it("treats a meta-click like a ctrl-click", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(0, 3), { metaKey: true });
    release();

    expect(harness.cellPicks).toEqual([addressOf(0, 3)]);
  });

  it("ignores a matching element without data-row/data-col instead of picking (-1, -1)", () => {
    const harness = createPicker({ omitResolver: true });
    const orphan = document.createElement("div");

    orphan.className = "grid-cell";
    harness.root.appendChild(orphan);

    pressOn(orphan, { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([]);
    expect(harness.rangePicks).toEqual([]);
    expect(harness.picker.cellFromTarget(orphan)).toBeNull();
  });

  it("emits a normalized range after dragging backwards across cells", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(2, 3), { ctrlKey: true });
    moveOver(harness.cellAt(0, 1));
    release();

    expect(harness.rangePicks).toEqual([{ start: addressOf(0, 1), end: addressOf(2, 3) }]);
    expect(harness.cellPicks).toEqual([]);
  });

  it("emits a cell pick when the drag ends on the anchor cell", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    moveOver(harness.cellAt(1, 1));
    release();

    expect(harness.cellPicks).toEqual([addressOf(1, 1)]);
    expect(harness.rangePicks).toEqual([]);
  });

  it("keeps the last resolvable cell when the drag leaves the grid", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(0, 0), { ctrlKey: true });
    moveOver(harness.cellAt(1, 1));
    moveOver(harness.root);
    release();

    expect(harness.rangePicks).toEqual([{ start: addressOf(0, 0), end: addressOf(1, 1) }]);
  });

  it("ignores mousedown without ref mode or a modifier", () => {
    const harness = createPicker();
    const event = pressOn(harness.cellAt(0, 0));

    release();

    expect(harness.cellPicks).toEqual([]);
    expect(harness.ephemeralCalls).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores mousedown outside a resolvable cell", () => {
    const harness = createPicker();

    pressOn(harness.root, { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([]);
    expect(harness.ephemeralCalls).toEqual([]);
  });

  it("ignores mousedown when resolveAddress returns null", () => {
    const harness = createPicker({ resolveAddress: () => null });

    pressOn(harness.cellAt(2, 2), { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([]);
    expect(harness.ephemeralCalls).toEqual([]);
  });

  it("ignores mousedown inside the formula editor", () => {
    const harness = createPicker();
    const editorHost = document.createElement("div");
    const editorCell = document.createElement("div");

    editorHost.className = CN.editor;
    editorCell.className = "grid-cell";
    editorCell.dataset.row = "0";
    editorCell.dataset.col = "0";
    editorHost.appendChild(editorCell);
    harness.root.appendChild(editorHost);

    pressOn(editorCell, { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([]);
    expect(harness.ephemeralCalls).toEqual([]);
  });

  it("falls back to data attributes when no resolveAddress is injected", () => {
    const harness = createPicker({ omitResolver: true });

    pressOn(harness.cellAt(3, 0), { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([addressOf(3, 0)]);
  });

  it("prevents default on a mousedown that starts a pick", () => {
    const harness = createPicker();
    const event = pressOn(harness.cellAt(0, 0), { ctrlKey: true });

    expect(event.defaultPrevented).toBe(true);

    release();
  });

  it("highlights the anchor on mousedown, grows it while dragging, and clears it on mouseup", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(0, 0), { ctrlKey: true });
    moveOver(harness.cellAt(1, 2));
    release();

    expect(harness.ephemeralCalls).toEqual([
      { range: { start: addressOf(0, 0), end: addressOf(0, 0) }, color: EPHEMERAL_COLOR },
      { range: { start: addressOf(0, 0), end: addressOf(1, 2) }, color: EPHEMERAL_COLOR },
      { range: null, color: undefined },
    ]);
  });

  it("ignores mousemove when no drag is active", () => {
    const harness = createPicker();

    moveOver(harness.cellAt(2, 2));

    expect(harness.ephemeralCalls).toEqual([]);
  });

  it("picks without a modifier while in ref selection mode", () => {
    const harness = createPicker();

    harness.picker.enterRefSelectionMode();
    pressOn(harness.cellAt(2, 1));
    release();

    expect(harness.cellPicks).toEqual([addressOf(2, 1)]);
  });

  it("toggles the ref mode class on the root", () => {
    const harness = createPicker({ refModeClass: "ref-mode-active" });

    harness.picker.enterRefSelectionMode();
    expect(harness.root.classList.contains("ref-mode-active")).toBe(true);

    harness.picker.exitRefSelectionMode();
    expect(harness.root.classList.contains("ref-mode-active")).toBe(false);
  });

  it("clears the ephemeral highlight when leaving ref selection mode", () => {
    const harness = createPicker();

    harness.picker.exitRefSelectionMode();

    expect(harness.ephemeralCalls).toEqual([{ range: null, color: undefined }]);
  });

  it("uses the constructor default color when ref selection mode has no resolver", () => {
    const harness = createPicker();

    harness.picker.enterRefSelectionMode();
    pressOn(harness.cellAt(0, 0), { ctrlKey: true });

    expect(harness.ephemeralCalls.at(-1)).toEqual({
      range: { start: addressOf(0, 0), end: addressOf(0, 0) },
      color: EPHEMERAL_COLOR,
    });
  });

  it("asks the resolver passed into enterRefSelectionMode for the dragged range's color", () => {
    const harness = createPicker();
    const resolvedRanges: CellRange[] = [];

    harness.picker.enterRefSelectionMode((range) => {
      resolvedRanges.push(range);

      return "var(--hfe-ref-2)";
    });
    pressOn(harness.cellAt(0, 0), { ctrlKey: true });

    expect(harness.ephemeralCalls.at(-1)).toEqual({
      range: { start: addressOf(0, 0), end: addressOf(0, 0) },
      color: "var(--hfe-ref-2)",
    });
    expect(resolvedRanges).toEqual([{ start: addressOf(0, 0), end: addressOf(0, 0) }]);
  });

  it("re-consults the resolver with the normalized range as the drag grows", () => {
    const harness = createPicker();
    const resolvedRanges: CellRange[] = [];

    harness.picker.enterRefSelectionMode((range) => {
      resolvedRanges.push(range);

      return `var(--hfe-ref-${resolvedRanges.length})`;
    });
    pressOn(harness.cellAt(0, 0), { ctrlKey: true });
    moveOver(harness.cellAt(1, 1));

    expect(harness.ephemeralCalls.at(-1)).toEqual({
      range: { start: addressOf(0, 0), end: addressOf(1, 1) },
      color: "var(--hfe-ref-2)",
    });
    expect(resolvedRanges).toEqual([
      { start: addressOf(0, 0), end: addressOf(0, 0) },
      { start: addressOf(0, 0), end: addressOf(1, 1) },
    ]);
  });

  it("resets to the default color after exiting and re-entering ref selection mode", () => {
    const harness = createPicker();

    harness.picker.enterRefSelectionMode(() => "var(--hfe-ref-2)");
    harness.picker.exitRefSelectionMode();
    harness.picker.enterRefSelectionMode();
    pressOn(harness.cellAt(0, 0), { ctrlKey: true });

    expect(harness.ephemeralCalls.at(-1)).toEqual({
      range: { start: addressOf(0, 0), end: addressOf(0, 0) },
      color: EPHEMERAL_COLOR,
    });
  });

  it("stops picking and highlighting after destroy", () => {
    const harness = createPicker();

    harness.picker.destroy();
    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([]);
    expect(harness.rangePicks).toEqual([]);
    expect(harness.ephemeralCalls).toEqual([]);
  });

  it("resolves the cell address at a point via elementFromPoint", () => {
    const harness = createPicker();
    const elementFromPointSpy = vi
      .spyOn(document, "elementFromPoint")
      .mockReturnValue(harness.cellAt(2, 2));

    expect(harness.picker.getCellAddressAt(25, 40)).toEqual(addressOf(2, 2));
    expect(elementFromPointSpy).toHaveBeenCalledWith(25, 40);
  });

  it("returns null from getCellAddressAt when nothing is at the point", () => {
    const harness = createPicker();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);

    expect(harness.picker.getCellAddressAt(5, 5)).toBeNull();
  });

  it("marks a ctrl-click pick as append", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(1, 2), { ctrlKey: true });
    release();

    expect(harness.cellPickPayloads).toEqual([{ ref: addressOf(1, 2), append: true }]);
  });

  it("marks a plain click in ref mode as not append", () => {
    const harness = createPicker();

    harness.picker.enterRefSelectionMode();
    pressOn(harness.cellAt(2, 1));
    release();

    expect(harness.cellPickPayloads).toEqual([{ ref: addressOf(2, 1), append: false }]);
  });

  it("reports whether ref-selection mode is active", () => {
    const { picker } = createPicker();

    expect(picker.isRefSelectionActive()).toBe(false);

    picker.enterRefSelectionMode();

    expect(picker.isRefSelectionActive()).toBe(true);

    picker.exitRefSelectionMode();

    expect(picker.isRefSelectionActive()).toBe(false);
  });

  describe("ineligible clicks while in ref mode", () => {
    it("emits an outside cell click instead of starting a pick", () => {
      const harness = createPicker();

      harness.picker.enterRefSelectionMode(undefined, () => false);
      pressOn(harness.cellAt(2, 3));

      expect(harness.outsideClicks).toEqual([{ sheet: SHEET, row: 2, col: 3 }]);
      expect(harness.ephemeralCalls).toEqual([]);

      release();

      expect(harness.cellPicks).toEqual([]);
    });

    it("does not prevent the default mousedown action", () => {
      const harness = createPicker();

      harness.picker.enterRefSelectionMode(undefined, () => false);

      const event = pressOn(harness.cellAt(1, 1));

      expect(event.defaultPrevented).toBe(false);
    });

    it("still picks when the eligibility resolver returns true", () => {
      const harness = createPicker();

      harness.picker.enterRefSelectionMode(undefined, () => true);
      pressOn(harness.cellAt(1, 1));
      release();

      expect(harness.outsideClicks).toEqual([]);
      expect(harness.cellPicks).toEqual([{ sheet: SHEET, row: 1, col: 1 }]);
    });

    it("drops the eligibility resolver on exitRefSelectionMode", () => {
      const harness = createPicker();

      harness.picker.enterRefSelectionMode(undefined, () => false);
      harness.picker.exitRefSelectionMode();
      pressOn(harness.cellAt(1, 1), { ctrlKey: true });
      release();

      expect(harness.outsideClicks).toEqual([]);
      expect(harness.cellPicks).toEqual([{ sheet: SHEET, row: 1, col: 1 }]);
    });
  });
});

describe("DomRangePicker header picking", () => {
  it("emits a header pick for a header click while eligible", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(2));
    release();

    expect(harness.headerPicks).toEqual([
      { axis: "column", sheet: SHEET, start: 2, end: 2, append: false },
    ]);
  });

  it("extends the pick across headers on drag and emits the span", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(1));
    moveOver(harness.colHeaderAt(3));
    release();

    expect(harness.headerPicks).toEqual([
      { axis: "column", sheet: SHEET, start: 1, end: 3, append: false },
    ]);
    expect(harness.ephemeralCalls).toEqual([
      { range: { start: addressOf(0, 1), end: addressOf(3, 1) }, color: EPHEMERAL_COLOR },
      { range: { start: addressOf(0, 1), end: addressOf(3, 3) }, color: EPHEMERAL_COLOR },
      { range: null, color: undefined },
    ]);
  });

  it("cancels an in-flight header drag on destroy and clears the preview", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(1));
    harness.picker.destroy();

    expect(harness.headerPicks).toEqual([]);
    expect(harness.ephemeralCalls.at(-1)).toEqual({ range: null, color: undefined });
  });

  it("disarms a stale click swallow on the next mousedown", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(1));
    release();
    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    const staleClick = new MouseEvent("click", { bubbles: true, cancelable: true });

    harness.colHeaderAt(2).dispatchEvent(staleClick);

    expect(staleClick.defaultPrevented).toBe(false);
  });

  it("extends a column-header drag over body cells by their column", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(1));
    moveOver(harness.cellAt(2, 3));
    release();

    expect(harness.headerPicks).toEqual([
      { axis: "column", sheet: SHEET, start: 1, end: 3, append: false },
    ]);
  });

  it("extends a row-header drag over body cells by their row", () => {
    const harness = createPicker({
      withRowHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.rowHeaderAt(1));
    moveOver(harness.cellAt(3, 2));
    release();

    expect(harness.headerPicks).toEqual([
      { axis: "row", sheet: SHEET, start: 1, end: 3, append: false },
    ]);
  });

  it("extends the pick across row headers on drag and emits the span", () => {
    const harness = createPicker({
      withRowHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.rowHeaderAt(1));
    moveOver(harness.rowHeaderAt(3));
    release();

    expect(harness.headerPicks).toEqual([
      { axis: "row", sheet: SHEET, start: 1, end: 3, append: false },
    ]);
    expect(harness.ephemeralCalls).toEqual([
      { range: { start: addressOf(1, 0), end: addressOf(1, 3) }, color: EPHEMERAL_COLOR },
      { range: { start: addressOf(1, 0), end: addressOf(3, 3) }, color: EPHEMERAL_COLOR },
      { range: null, color: undefined },
    ]);
  });

  it("clears header-drag state on exitRefSelectionMode mid-drag", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(1));
    harness.picker.exitRefSelectionMode();
    release();

    expect(harness.headerPicks).toEqual([]);
  });

  it("leaves header clicks untouched while ineligible (no preventDefault, no outside-click)", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode(undefined, () => false);

    const event = pressOn(harness.colHeaderAt(1));

    release();

    expect(event.defaultPrevented).toBe(false);
    expect(harness.outsideClicks).toEqual([]);
    expect(harness.headerPicks).toEqual([]);
    expect(harness.ephemeralCalls).toEqual([]);
  });

  it("keeps cell picking behavior unchanged when header options are absent", () => {
    const harness = createPicker();

    pressOn(harness.cellAt(1, 2), { ctrlKey: true });
    release();

    expect(harness.cellPicks).toEqual([addressOf(1, 2)]);
    expect(harness.headerPicks).toEqual([]);
  });

  it("prevents the trailing click on a header after a routed header pick", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode();
    pressOn(harness.colHeaderAt(2));
    release();

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });

    harness.colHeaderAt(2).dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it("does not prevent a header click without a routed header pick", () => {
    const harness = createPicker({
      withHeaders: true,
      getGridSize: () => ({ rows: GRID_ROWS, cols: GRID_COLS }),
    });

    harness.picker.enterRefSelectionMode(undefined, () => false);
    pressOn(harness.colHeaderAt(2));
    release();

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });

    harness.colHeaderAt(2).dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
  });
});

describe("DomRangePicker edge autoscroll", () => {
  function makeScrollElement(): HTMLElement {
    const scrollElement = document.createElement("div");

    Object.defineProperty(scrollElement, "getBoundingClientRect", {
      value: () =>
        ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect,
    });
    document.body.appendChild(scrollElement);

    return scrollElement;
  }

  function movePointer(x: number, y: number): void {
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y, buttons: 1 }),
    );
  }

  it("scrolls the scroll element and extends the drag when the pointer leaves it", () => {
    const scrollElement = makeScrollElement();
    const harness = createPicker({ getScrollElement: () => scrollElement });

    vi.spyOn(document, "elementFromPoint").mockImplementation(() => harness.cellAt(3, 1));

    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    movePointer(50, 140);

    expect(scrollElement.scrollTop).toBeGreaterThan(0);

    release();

    expect(harness.rangePicks).toEqual([{ start: addressOf(1, 1), end: addressOf(3, 1) }]);
  });

  it("does not scroll while the pointer stays inside the scroll element", () => {
    const scrollElement = makeScrollElement();
    const harness = createPicker({ getScrollElement: () => scrollElement });

    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    movePointer(50, 50);

    expect(scrollElement.scrollTop).toBe(0);
    release();
  });

  it("does not scroll when no drag is active", () => {
    const scrollElement = makeScrollElement();

    createPicker({ getScrollElement: () => scrollElement });
    movePointer(50, 140);

    expect(scrollElement.scrollTop).toBe(0);
  });

  it("finalizes the pick on a buttonless mousemove (button released off-window)", () => {
    const scrollElement = makeScrollElement();
    const harness = createPicker({ getScrollElement: () => scrollElement });

    vi.spyOn(document, "elementFromPoint").mockImplementation(() => harness.cellAt(3, 1));

    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    movePointer(50, 140);
    expect(scrollElement.scrollTop).toBeGreaterThan(0);

    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, buttons: 0 }));

    expect(harness.rangePicks).toEqual([{ start: addressOf(1, 1), end: addressOf(3, 1) }]);

    const scrolled = scrollElement.scrollTop;
    movePointer(50, 200);
    expect(scrollElement.scrollTop).toBe(scrolled);
  });

  it("finalizes the pick on window blur (button released off-window)", () => {
    const scrollElement = makeScrollElement();
    const harness = createPicker({ getScrollElement: () => scrollElement });

    pressOn(harness.cellAt(2, 2), { ctrlKey: true });
    window.dispatchEvent(new Event("blur"));

    expect(harness.cellPicks).toEqual([addressOf(2, 2)]);
  });

  it("uses the root itself as the default scroll element when it is scrollable", () => {
    const harness = createPicker();

    harness.root.style.overflow = "auto";
    Object.defineProperty(harness.root, "getBoundingClientRect", {
      value: () =>
        ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect,
    });
    vi.spyOn(document, "elementFromPoint").mockImplementation(() => harness.cellAt(2, 1));

    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    movePointer(50, 140);

    expect(harness.root.scrollTop).toBeGreaterThan(0);
    release();
  });

  it("defaults the scroll element to the nearest scrollable ancestor of the root", () => {
    const wrapper = document.createElement("div");

    wrapper.style.overflow = "auto";
    Object.defineProperty(wrapper, "getBoundingClientRect", {
      value: () =>
        ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect,
    });
    document.body.appendChild(wrapper);

    const harness = createPicker();

    wrapper.appendChild(harness.root);
    vi.spyOn(document, "elementFromPoint").mockImplementation(() => harness.cellAt(2, 1));

    pressOn(harness.cellAt(1, 1), { ctrlKey: true });
    movePointer(50, 140);

    expect(wrapper.scrollTop).toBeGreaterThan(0);
    release();
  });
});

describe("DomRangePicker scroll re-extend", () => {
  it("re-queries the cell under a stationary pointer when a scroll changes what's there", () => {
    const harness = createPicker();
    const scrollElement = document.createElement("div");

    document.body.appendChild(scrollElement);

    let underPointer = harness.cellAt(1, 1);

    vi.spyOn(document, "elementFromPoint").mockImplementation(() => underPointer);

    pressOn(harness.cellAt(1, 1), { ctrlKey: true, clientX: 10, clientY: 10 });

    underPointer = harness.cellAt(2, 3);
    scrollElement.dispatchEvent(new Event("scroll", { bubbles: false }));

    expect(harness.ephemeralCalls.at(-1)).toEqual({
      range: { start: addressOf(1, 1), end: addressOf(2, 3) },
      color: EPHEMERAL_COLOR,
    });

    release();

    expect(harness.rangePicks).toEqual([{ start: addressOf(1, 1), end: addressOf(2, 3) }]);
  });

  it("ignores scroll when no drag is active", () => {
    const harness = createPicker();
    const scrollElement = document.createElement("div");

    document.body.appendChild(scrollElement);
    vi.spyOn(document, "elementFromPoint").mockImplementation(() => harness.cellAt(2, 3));

    scrollElement.dispatchEvent(new Event("scroll", { bubbles: false }));

    expect(harness.ephemeralCalls).toEqual([]);
  });
});
