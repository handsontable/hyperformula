/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {CellAddress} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {Transformer} from './Transformer'

type SheetAwareAddress = CellAddress | RowAddress | ColumnAddress

/**
 * Transformer that reassigns references from a merged sheet into the surviving sheet.
 */
export class RenameSheetTransformer extends Transformer {
  constructor(
    public readonly sheetIdToKeep: number,
    public readonly sheetBeingMerged: number,
  ) {
    super()
  }

  /**
   * Returns id of sheet that survives merge operation.
   *
   * @returns {number} sheet identifier.
   */
  public get sheet(): number {
    return this.sheetIdToKeep
  }

  /**
   * Sheet merge cannot be undone because original sheet id is lost.
   *
   * @returns {boolean} always true to indicate transformation irreversibility.
   */
  public isIrreversible(): boolean {
    return true
  }

  /**
   * Updates cell address sheet when it points to merged sheet.
   *
   * @param {T} dependencyAddress - dependency address needing sheet update.
   * @param {SimpleCellAddress} _formulaAddress - location of formula (unused but required by base class).
   * @returns {T | false} updated address or false when nothing changes.
   */
  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, _formulaAddress: SimpleCellAddress): T | false {
    return this.updateSheetInAddress(dependencyAddress)
  }

  /**
   * Updates sheet for both ends of cell range.
   *
   * @param {CellAddress} start - start address of range.
   * @param {CellAddress} end - end address of range.
   * @param {SimpleCellAddress} _formulaAddress - formula location (unused).
   * @returns {[CellAddress, CellAddress] | false} updated range tuple or false when unchanged.
   */
  protected transformCellRange(start: CellAddress, end: CellAddress, _formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | false {
    return this.transformRange(start, end)
  }

  /**
   * Updates sheet for both ends of column range.
   *
   * @param {ColumnAddress} start - beginning column of range.
   * @param {ColumnAddress} end - ending column of range.
   * @param {SimpleCellAddress} _formulaAddress - formula location (unused).
   * @returns {[ColumnAddress, ColumnAddress] | false} updated column range or false.
   */
  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, _formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | false {
    return this.transformRange(start, end)
  }

  /**
   * Updates sheet for both ends of row range.
   *
   * @param {RowAddress} start - beginning row address.
   * @param {RowAddress} end - ending row address.
   * @param {SimpleCellAddress} _formulaAddress - formula location (unused).
   * @returns {[RowAddress, RowAddress] | false} updated row range or false.
   */
  protected transformRowRange(start: RowAddress, end: RowAddress, _formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | false {
    return this.transformRange(start, end)
  }

  /**
   * Node addresses are already absolute, so no change is needed.
   *
   * @param {SimpleCellAddress} address - node address to inspect.
   * @returns {SimpleCellAddress} original address unchanged.
   */
  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  /**
   * Updates sheet identifier for both range ends if needed.
   *
   * @param {T} start - range start address.
   * @param {T} end - range end address.
   * @returns {[T, T] | false} tuple with updated addresses or false when no updates happen.
   */
  private transformRange<T extends SheetAwareAddress>(start: T, end: T): [T, T] | false {
    const newStart = this.updateSheetInAddress(start)
    const newEnd = this.updateSheetInAddress(end)

    if (newStart || newEnd) {
      return [(newStart || start), (newEnd || end)]
    }

    return false
  }

  /**
   * Replaces sheet id in address when it points to merged sheet.
   *
   * @param {T} address - address to update.
   * @returns {T | false} address with new sheet id or false when no change occurs.
   */
  private updateSheetInAddress<T extends SheetAwareAddress>(address: T): T | false {
    if (address.sheet === this.sheetBeingMerged) {
      return address.withSheet(this.sheetIdToKeep) as T
    }

    return false
  }
}
