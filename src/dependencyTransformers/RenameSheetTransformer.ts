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

export class RenameSheetTransformer extends Transformer {
  constructor(
    public readonly sheetIdToKeep: number,
    public readonly sheetBeingMerged: number,
  ) {
    super()
  }

  public get sheet(): number {
    return this.sheetIdToKeep
  }

  public isIrreversible(): boolean {
    return true
  }

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, _formulaAddress: SimpleCellAddress): T | false {
    return this.updateSheetInAddress(dependencyAddress)
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, _formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | false {
    return this.transformRange(start, end)
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, _formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | false {
    return this.transformRange(start, end)
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, _formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | false {
    return this.transformRange(start, end)
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  private transformRange<T extends SheetAwareAddress>(start: T, end: T): [T, T] | false {
    const newStart = this.updateSheetInAddress(start)
    const newEnd = this.updateSheetInAddress(end)

    if (newStart || newEnd) {
      return [(newStart || start), (newEnd || end)]
    }

    return false
  }

  private updateSheetInAddress<T extends SheetAwareAddress>(address: T): T | false {
    if (address.sheet === this.sheetBeingMerged) {
      return address.withSheet(this.sheetIdToKeep) as T
    }

    return false
  }
}
