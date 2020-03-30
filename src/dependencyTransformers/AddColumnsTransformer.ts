import {ColumnsSpan} from '../ColumnsSpan'
import {Ast, CellAddress} from '../parser'
import {absoluteSheetReference, ErrorType, SimpleCellAddress} from '../Cell'
import {RowRangeAst} from '../parser/Ast'
import {AddressWithColumn} from './common'
import {Transformer} from './Transformer'
import {RowAddress} from '../parser/RowAddress'
import {ColumnAddress} from '../parser/ColumnAddress'

export class AddColumnsTransformer extends Transformer {
  constructor(
    private columnsSpan: ColumnsSpan
  ) {
    super()
  }

  protected transformRowRangeAst(ast: RowRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformCellAddress<T extends AddressWithColumn>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false {
    const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
    // Case 4 and 5
    if ((absoluteDependencySheet !== this.columnsSpan.sheet)
      && (formulaAddress.sheet !== this.columnsSpan.sheet)) {
      return false
    }

    const absolutizedDependencyAddress = dependencyAddress.toSimpleColumnAddress(formulaAddress)

    // Case 3
    if ((absoluteDependencySheet === this.columnsSpan.sheet)
      && (formulaAddress.sheet !== this.columnsSpan.sheet)) {
      if (this.columnsSpan.columnStart <= absolutizedDependencyAddress.col) {
        return dependencyAddress.shiftedByColumns(this.columnsSpan.numberOfColumns) as T
      } else {
        return false
      }
    }

    // Case 2
    if ((formulaAddress.sheet === this.columnsSpan.sheet)
      && (absoluteDependencySheet !== this.columnsSpan.sheet)) {
      if (dependencyAddress.isColumnAbsolute()) {
        return false
      }

      if (formulaAddress.col < this.columnsSpan.columnStart) {
        return false
      }

      return dependencyAddress.shiftedByColumns(-this.columnsSpan.numberOfColumns) as T
    }

    // Case 1
    if (dependencyAddress.isColumnAbsolute()) {
      if (dependencyAddress.col < this.columnsSpan.columnStart) { // Case Aa
        return false
      } else { // Case Ab
        return dependencyAddress.shiftedByColumns(this.columnsSpan.numberOfColumns) as T
      }
    } else {
      const absolutizedDependencyAddress = dependencyAddress.toSimpleColumnAddress(formulaAddress)
      if (absolutizedDependencyAddress.col < this.columnsSpan.columnStart) {
        if (formulaAddress.col < this.columnsSpan.columnStart) { // Case Raa
          return false
        } else { // Case Rab
          return dependencyAddress.shiftedByColumns(-this.columnsSpan.numberOfColumns) as T
        }
      } else {
        if (formulaAddress.col < this.columnsSpan.columnStart) { // Case Rba
          return dependencyAddress.shiftedByColumns(this.columnsSpan.numberOfColumns) as T
        } else { // Case Rbb
          return false
        }
      }
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    if (this.columnsSpan.sheet === address.sheet && this.columnsSpan.columnStart <= address.col) {
      return {
        ...address,
        col: address.col + this.columnsSpan.numberOfColumns,
      }
    } else {
      return address
    }
  }

  private transformRange<T extends AddressWithColumn>(start: T, end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
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