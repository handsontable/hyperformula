import { formatRef } from "./refFormat";
import type {
  CellAddress,
  CellPickListener,
  CellRange,
  Direction,
  GridSelection,
  GridSize,
  IGridAdapter,
  OutsideCellClickListener,
  OutsideClickCommitMode,
  RangeHighlight,
  RangePickListener,
  Unsubscribe,
} from "./types";

/**
 * No-op {@link IGridAdapter} implementation — the fallback `FormulaBuilder` uses when
 * constructed without an adapter, and the base class for basic adapters.
 *
 * @category Grid Adapter
 * @example
 * ```ts
 * class MyAdapter extends NullAdapter {
 *   getActiveCell() {
 *     return this.host.selection;
 *   }
 * }
 * ```
 */
export class NullAdapter implements IGridAdapter {
  readonly outsideClickCommitMode: OutsideClickCommitMode = "emitted";

  getCellAddressAt(_x: number, _y: number): CellAddress | null {
    return null;
  }

  formatRef(ref: CellAddress | CellRange): string {
    return formatRef(ref);
  }

  setHighlights(_items: RangeHighlight[]): void {}
  highlightRange(_range: CellRange, _color: string): void {}
  clearEphemeralHighlight(): void {}
  clearHighlights(): void {}
  setOverlayClassName(_className: string | null): void {}
  onCellPick(_callback: CellPickListener): Unsubscribe {
    return () => {};
  }

  onRangePick(_callback: RangePickListener): Unsubscribe {
    return () => {};
  }

  onOutsideCellClick(_callback: OutsideCellClickListener): Unsubscribe {
    return () => {};
  }

  enterRefSelectionMode(): void {}
  exitRefSelectionMode(): void {}

  getGridSize(): GridSize {
    return { rows: 0, cols: 0 };
  }

  getDataEdge(from: CellAddress, _direction: Direction): CellAddress {
    return from;
  }

  stepCell(from: CellAddress, _direction: Direction): CellAddress {
    return from;
  }

  scrollCellIntoView(_address: CellAddress): void {}

  destroy(): void {}

  getActiveCell(): CellAddress | null {
    return null;
  }

  onSelectionChange(_callback: (selection: GridSelection | null) => void): Unsubscribe {
    return () => {};
  }

  getCellFormula(_address: CellAddress): string {
    return "";
  }

  beginEdit(_address: CellAddress, _seed?: string): boolean {
    return false;
  }

  selectFirstCell(): void {}

  setActiveCell(_address: CellAddress): void {}

  setSelection(_range: CellRange): void {}

  onInlineEditStart(_callback: (mount: HTMLElement, seed: string) => void): Unsubscribe {
    return () => {};
  }

  onInlineEditClose(_callback: () => void): Unsubscribe {
    return () => {};
  }

  onSwitchToInline(_callback: () => void): Unsubscribe {
    return () => {};
  }

  commit(_value: string, _direction?: Direction): void {}

  cancel(): void {}

  setInlineEditorVisible(_visible: boolean): void {}
}
