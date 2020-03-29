import {ColumnsSpan} from '../ColumnsSpan'
import {Ast, buildCellErrorAst, CellRangeAst, ErrorAst} from '../parser'
import {absoluteSheetReference, CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst, RowRangeAst} from '../parser/Ast'
import {AddressWithRow} from './common'
import {Transformer} from './Transformer'
import {RowsSpan} from '../RowsSpan'

export class RemoveRowsTransformer extends Transformer {
  constructor(
    private rowsSpan: RowsSpan
  ) {
    super()
  }

  protected transformCellRangeAst(ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellRangeAst | ErrorAst {
    const newRange = this.transformRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return {...ast, start: newRange[0], end: newRange[1]}
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformColumnRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
  }

  protected transformRowRangeAst(ast: RowRangeAst, formulaAddress: SimpleCellAddress): Ast {
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