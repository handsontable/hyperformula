import {Ast, CellAddress} from '../parser'
import {absoluteSheetReference, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst} from '../parser/Ast'
import {Transformer} from './Transformer'
import {RowsSpan} from '../RowsSpan'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {AddressWithRow} from '../parser/Address'

export class RemoveRowsTransformer extends Transformer {
  constructor(
    public readonly rowsSpan: RowsSpan
  ) {
    super()
  }

  public get sheet(): number {
    return this.rowsSpan.sheet
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformCellAddress<T extends AddressWithRow>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false {
    const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
    // Case 4
    if (this.rowsSpan.sheet !== formulaAddress.sheet && this.rowsSpan.sheet !== absoluteDependencySheet) {
      return false
    }

    // Case 3 -- removed row in same sheet where dependency is but formula in different
    if (this.rowsSpan.sheet !== formulaAddress.sheet && this.rowsSpan.sheet === absoluteDependencySheet) {
      const absoluteDependencyAddress = dependencyAddress.toSimpleRowAddress(formulaAddress)
      if (absoluteDependencyAddress.row < this.rowsSpan.rowStart) { // 3.ARa
        return false
      } else if (absoluteDependencyAddress.row > this.rowsSpan.rowEnd) { // 3.ARb
        return dependencyAddress.shiftedByRows(-this.rowsSpan.numberOfRows) as T
      }
    }

    // Case 2 -- removed row in same sheet where formula but dependency in different sheet
    if (this.rowsSpan.sheet === formulaAddress.sheet && this.rowsSpan.sheet !== absoluteDependencySheet) {
      if (dependencyAddress.isRowAbsolute()) { // 2.A
        return false
      } else {
        if (formulaAddress.row < this.rowsSpan.rowStart) { // 2.Ra
          return false
        } else if (formulaAddress.row > this.rowsSpan.rowEnd) { // 2.Rb
          return dependencyAddress.shiftedByRows(this.rowsSpan.numberOfRows) as T
        }
      }
    }

    // Case 1 -- same sheet
    if (this.rowsSpan.sheet === formulaAddress.sheet && this.rowsSpan.sheet === absoluteDependencySheet) {
      if (dependencyAddress.isRowAbsolute()) {
        if (dependencyAddress.row < this.rowsSpan.rowStart) { // 1.Aa
          return false
        } else if (dependencyAddress.row > this.rowsSpan.rowEnd) { // 1.Ab
          return dependencyAddress.shiftedByRows(-this.rowsSpan.numberOfRows) as T
        }
      } else {
        const absoluteDependencyAddress = dependencyAddress.toSimpleRowAddress(formulaAddress)
        if (absoluteDependencyAddress.row < this.rowsSpan.rowStart) {
          if (formulaAddress.row < this.rowsSpan.rowStart) { // 1.Raa
            return false
          } else if (formulaAddress.row > this.rowsSpan.rowEnd) { // 1.Rab
            return dependencyAddress.shiftedByRows(this.rowsSpan.numberOfRows) as T
          }
        } else if (absoluteDependencyAddress.row > this.rowsSpan.rowEnd) {
          if (formulaAddress.row < this.rowsSpan.rowStart) { // 1.Rba
            return dependencyAddress.shiftedByRows(-this.rowsSpan.numberOfRows) as T
          } else if (formulaAddress.row > this.rowsSpan.rowEnd) { // 1.Rbb
            return false
          }
        }
      }
    }

    // 1.Ac, 1.Rca, 1.Rcb, 3.Ac, 3.Rca, 3.Rcb
    return ErrorType.REF
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
    return this.transformRange(start, end, formulaAddress)
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
    throw Error('Not implemented')
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    if (this.rowsSpan.sheet === address.sheet && this.rowsSpan.rowStart <= address.row) {
      return {
        ...address,
        row: address.row - this.rowsSpan.numberOfRows,
      }
    } else {
      return address
    }
  }

  private transformRange<T extends AddressWithRow>(start: T, end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
    const startSheet = absoluteSheetReference(start, formulaAddress)

    let actualStart = start
    let actualEnd = end

    if (this.rowsSpan.sheet === startSheet) {
      const startSCA = start.toSimpleRowAddress(formulaAddress)
      const endSCA = end.toSimpleRowAddress(formulaAddress)

      if (this.rowsSpan.rowStart <= startSCA.row && this.rowsSpan.rowEnd >= endSCA.row) {
        return ErrorType.REF
      }

      if (startSCA.row >= this.rowsSpan.rowStart && startSCA.row <= this.rowsSpan.rowEnd) {
        actualStart = start.shiftedByRows(this.rowsSpan.rowEnd - startSCA.row + 1) as T
      }

      if (endSCA.row >= this.rowsSpan.rowStart && endSCA.row <= this.rowsSpan.rowEnd) {
        actualEnd = end.shiftedByRows(-(endSCA.row - this.rowsSpan.rowStart + 1)) as T
      }
    }

    const newStart = this.transformCellAddress(actualStart, formulaAddress)
    const newEnd = this.transformCellAddress(actualEnd, formulaAddress)
    if (newStart === false && newEnd === false) {
      return [actualStart, actualEnd]
    } else if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
      throw Error('Cannot happen')
    } else {
      return [newStart || actualStart, newEnd || actualEnd]
    }
  }
}