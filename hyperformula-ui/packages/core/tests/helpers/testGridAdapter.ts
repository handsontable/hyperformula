import { stepCell } from "../../src/adapter/cell";
import type {
  CellAddress,
  CellPickListener,
  CellRange,
  Direction,
  GridSelection,
  GridSize,
  HeaderPick,
  HeaderPickListener,
  IGridAdapter,
  OutsideCellClickListener,
  OutsideClickCommitMode,
  RangeHighlight,
  RangePickListener,
  RefSelectionColorResolver,
  Unsubscribe,
} from "../../src/adapter/types";

export interface RefSelectionCall {
  resolveColor: RefSelectionColorResolver | undefined;
  isPickEligible: (() => boolean) | undefined;
}

export function formatRefAsRC(ref: CellAddress | CellRange): string {
  return "start" in ref
    ? `R${ref.start.row}C${ref.start.col}:R${ref.end.row}C${ref.end.col}`
    : `R${ref.row}C${ref.col}`;
}

interface TestGridAdapterOptions {
  formatRef?: (ref: CellAddress | CellRange) => string;
  active?: CellAddress | null;
  gridSize?: GridSize;
  outsideClickCommitMode?: OutsideClickCommitMode;
}

export class TestGridAdapter implements IGridAdapter {
  readonly outsideClickCommitMode: OutsideClickCommitMode;
  highlights: RangeHighlight[] = [];
  active: CellAddress | null;
  selectedCells: CellAddress[] = [];
  commits: string[] = [];
  refSelectionCalls: RefSelectionCall[] = [];
  private readonly refFormatter: (ref: CellAddress | CellRange) => string;
  private readonly gridSize: GridSize;
  private cellPickListener: CellPickListener | null = null;
  private rangePickListener: RangePickListener | null = null;
  private outsideClickListener: OutsideCellClickListener | null = null;
  private headerPickListener: HeaderPickListener | null = null;
  private inlineEditStartListener: ((mount: HTMLElement, seed: string) => void) | null = null;
  private inlineEditCloseListener: (() => void) | null = null;

  constructor(options: TestGridAdapterOptions = {}) {
    this.refFormatter = options.formatRef ?? (() => "");
    this.active = options.active ?? null;
    this.gridSize = options.gridSize ?? { rows: 100, cols: 100 };
    this.outsideClickCommitMode = options.outsideClickCommitMode ?? "emitted";
  }

  getCellAddressAt(): CellAddress | null {
    return null;
  }

  formatRef(ref: CellAddress | CellRange): string {
    return this.refFormatter(ref);
  }

  setHighlights(items: RangeHighlight[]): void {
    this.highlights = items;
  }

  highlightRange(): void {}

  clearEphemeralHighlight(): void {}

  clearHighlights(): void {}

  onCellPick(callback: CellPickListener): Unsubscribe {
    this.cellPickListener = callback;

    return () => {
      this.cellPickListener = null;
    };
  }

  onRangePick(callback: RangePickListener): Unsubscribe {
    this.rangePickListener = callback;

    return () => {
      this.rangePickListener = null;
    };
  }

  onHeaderPick(callback: HeaderPickListener): Unsubscribe {
    this.headerPickListener = callback;

    return () => {
      this.headerPickListener = null;
    };
  }

  onOutsideCellClick(callback: OutsideCellClickListener): Unsubscribe {
    this.outsideClickListener = callback;

    return () => {
      this.outsideClickListener = null;
    };
  }

  fireOutsideCellClick(address: CellAddress): void {
    this.outsideClickListener?.(address);
  }

  enterRefSelectionMode(
    resolveColor?: RefSelectionColorResolver,
    isPickEligible?: () => boolean,
  ): void {
    this.refSelectionCalls.push({ resolveColor, isPickEligible });
  }

  exitRefSelectionMode(): void {}

  getGridSize(): GridSize {
    return this.gridSize;
  }

  getDataEdge(from: CellAddress, _direction: Direction): CellAddress {
    return from;
  }

  stepCell(from: CellAddress, direction: Direction): CellAddress {
    return stepCell(from, direction, this.gridSize);
  }

  scrollCellIntoView(_address: CellAddress): void {}

  destroy(): void {}

  getActiveCell(): CellAddress | null {
    return this.active;
  }

  onSelectionChange(_callback: (selection: GridSelection | null) => void): Unsubscribe {
    return () => {};
  }

  getCellFormula(): string {
    return "";
  }

  beginEdit(): boolean {
    return false;
  }

  selectFirstCell(): void {}

  setActiveCell(address: CellAddress): void {
    this.active = address;
    this.selectedCells.push(address);
  }

  setSelection(_range: CellRange): void {}

  onInlineEditStart(callback: (mount: HTMLElement, seed: string) => void): Unsubscribe {
    this.inlineEditStartListener = callback;

    return () => {
      this.inlineEditStartListener = null;
    };
  }

  fireInlineEditStart(mount: HTMLElement, seed: string): void {
    this.inlineEditStartListener?.(mount, seed);
  }

  onInlineEditClose(callback: () => void): Unsubscribe {
    this.inlineEditCloseListener = callback;

    return () => {
      this.inlineEditCloseListener = null;
    };
  }

  fireInlineEditClose(): void {
    this.inlineEditCloseListener?.();
  }

  onSwitchToInline(): Unsubscribe {
    return () => {};
  }

  commit(value: string): void {
    this.commits.push(value);
  }

  cancel(): void {}

  setInlineEditorVisible(): void {}

  setOverlayClassName(): void {}

  pickCell(ref: CellAddress, append = false): void {
    this.cellPickListener?.({ ref, append });
  }

  pickRange(range: CellRange, append = false): void {
    this.rangePickListener?.({ ref: range, append });
  }

  fireHeaderPick(pick: HeaderPick): void {
    this.headerPickListener?.(pick);
  }
}
