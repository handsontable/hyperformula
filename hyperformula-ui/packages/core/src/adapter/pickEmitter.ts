import { ListenerSet } from "../events/listenerSet";
import type {
  CellAddress,
  CellPick,
  CellPickListener,
  HeaderPick,
  HeaderPickListener,
  OutsideCellClickListener,
  RangePick,
  RangePickListener,
  Unsubscribe,
} from "./types";

/**
 * Cell/range pick channel between an adapter and the editor: the adapter emits picks and
 * outside-cell clicks; the editor subscribes.
 *
 * @category Grid Adapter
 */
export class PickEmitter {
  private readonly cellListeners = new ListenerSet<[CellPick]>();
  private readonly rangeListeners = new ListenerSet<[RangePick]>();
  private readonly outsideListeners = new ListenerSet<[CellAddress]>();
  private readonly headerListeners = new ListenerSet<[HeaderPick]>();

  /** Subscribes to single-cell picks. */
  onCellPick(callback: CellPickListener): Unsubscribe {
    return this.cellListeners.add(callback);
  }

  /** Subscribes to range picks. */
  onRangePick(callback: RangePickListener): Unsubscribe {
    return this.rangeListeners.add(callback);
  }

  /** Emits a single-cell pick to subscribers. */
  emitCell(pick: CellPick): void {
    this.cellListeners.emit(pick);
  }

  /** Emits a range pick to subscribers. */
  emitRange(pick: RangePick): void {
    this.rangeListeners.emit(pick);
  }

  /** Subscribes to outside-cell clicks. */
  onOutsideCellClick(callback: OutsideCellClickListener): Unsubscribe {
    return this.outsideListeners.add(callback);
  }

  /** Emits an outside-cell click to subscribers. */
  emitOutsideCellClick(address: CellAddress): void {
    this.outsideListeners.emit(address);
  }

  /** Subscribes to whole-row/column header picks. */
  onHeaderPick(callback: HeaderPickListener): Unsubscribe {
    return this.headerListeners.add(callback);
  }

  /** Emits a whole-row/column header pick to subscribers. */
  emitHeader(pick: HeaderPick): void {
    this.headerListeners.emit(pick);
  }

  /** Drops every subscription. */
  clear(): void {
    this.cellListeners.clear();
    this.rangeListeners.clear();
    this.outsideListeners.clear();
    this.headerListeners.clear();
  }
}
