/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {Ast, CellAddress} from '../parser'
import {absoluteSheetReference, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst} from '../parser/Ast'
import {Transformer} from './Transformer'
import {RowsSpan} from '../RowsSpan'
import {RowAddress} from '../parser/RowAddress'
import {ColumnAddress} from '../parser/ColumnAddress'
import {AddressWithRow} from '../parser/Address'

export class AddRowsTransformer extends Transformer {
  constructor(
    public readonly rowsSpan: RowsSpan
  ) {
    super()
  }

  public get sheet(): number {
    return this.rowsSpan.sheet
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, _formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformColumnRange(_start: ColumnAddress, _end: ColumnAddress, _formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }

  protected transformCellAddress<T extends AddressWithRow>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false {
    const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
    // Case 4 and 5
    if ((absoluteDependencySheet !== this.rowsSpan.sheet)
      && (formulaAddress.sheet !== this.rowsSpan.sheet)) {
      return false
    }

    const absolutizedDependencyAddress = dependencyAddress.toSimpleRowAddress(formulaAddress)

    // Case 3
    if ((absoluteDependencySheet === this.rowsSpan.sheet)
      && (formulaAddress.sheet !== this.rowsSpan.sheet)) {
      if (this.rowsSpan.rowStart <= absolutizedDependencyAddress.row) {
        return dependencyAddress.shiftedByRows(this.rowsSpan.numberOfRows) as T
      } else {
        return false
      }
    }

    // Case 2
    if ((formulaAddress.sheet === this.rowsSpan.sheet)
      && (absoluteDependencySheet !== this.rowsSpan.sheet)) {
      if (dependencyAddress.isRowAbsolute()) {
        return false
      }

      if (formulaAddress.row < this.rowsSpan.rowStart) {
        return false
      }

      return dependencyAddress.shiftedByRows(-this.rowsSpan.numberOfRows) as T
    }

    // Case 1
    if (dependencyAddress.isRowAbsolute()) {
      if (dependencyAddress.row < this.rowsSpan.rowStart) { // Case Aa
        return false
      } else { // Case Ab
        return dependencyAddress.shiftedByRows(this.rowsSpan.numberOfRows) as T
      }
    } else {
      if (absolutizedDependencyAddress.row < this.rowsSpan.rowStart) {
        if (formulaAddress.row < this.rowsSpan.rowStart) { // Case Raa
          return false
        } else { // Case Rab
          return dependencyAddress.shiftedByRows(-this.rowsSpan.numberOfRows) as T
        }
      } else {
        if (formulaAddress.row < this.rowsSpan.rowStart) { // Case Rba
          return dependencyAddress.shiftedByRows(this.rowsSpan.numberOfRows) as T
        } else { // Case Rbb
          return false
        }
      }
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    if (this.rowsSpan.sheet === address.sheet && this.rowsSpan.rowStart <= address.row) {
      return {
        ...address,
        row: address.row + this.rowsSpan.numberOfRows,
      }
    } else {
      return address
    }
  }

  private transformRange<T extends AddressWithRow>(start: T, end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
    const newStart = this.transformCellAddress(start, formulaAddress)
    const newEnd = this.transformCellAddress(end, formulaAddress)
    if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
      return ErrorType.REF
    } else if (newStart || newEnd) {
      return [newStart || start, newEnd || end]
    } else {
      return false
    }
  }
}