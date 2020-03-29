import {Ast, buildCellErrorAst, CellRangeAst, ErrorAst} from '../parser'
import {absoluteSheetReference, CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst} from '../parser/Ast'
import {AddressWithRow} from './common'
import {Transformer} from './Transformer'
import {RowsSpan} from '../RowsSpan'

export class AddRowsTransformer extends Transformer {
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

  protected transformRowRangeAst(ast: Ast, formulaAddress: SimpleCellAddress): Ast {
    return ast
    // const newRange = this.transformRange(ast.start, ast.end, formulaAddress)
    // if (Array.isArray(newRange)) {
    //   return {...ast, start: newRange[0], end: newRange[1]}
    // } else if (newRange === ErrorType.REF) {
    //   return buildCellErrorAst(new CellError(ErrorType.REF))
    // } else {
    //   return ast
    // }
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