import {ColumnsSpan} from '../ColumnsSpan'
import {Ast, buildCellErrorAst, CellRangeAst, ErrorAst} from '../parser'
import {absoluteSheetReference, CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst} from '../parser/Ast'
import {AddressWithColumn} from './common'
import {Transformer} from './Transformer'

export class AddColumnsTransformer extends Transformer {
  constructor(
    private columnsSpan: ColumnsSpan
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
    const newRange = this.transformRange(ast.start, ast.end, formulaAddress)
    if (Array.isArray(newRange)) {
      return {...ast, start: newRange[0], end: newRange[1]}
    } else if (newRange === ErrorType.REF) {
      return buildCellErrorAst(new CellError(ErrorType.REF))
    } else {
      return ast
    }
  }

  protected transformRowRangeAst(ast: ColumnRangeAst, formulaAddress: SimpleCellAddress): Ast {
    return ast
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