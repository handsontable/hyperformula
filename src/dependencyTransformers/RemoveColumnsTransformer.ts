import {ColumnsSpan} from '../ColumnsSpan'
import {Ast, buildCellErrorAst, CellRangeAst, ErrorAst} from '../parser'
import {absoluteSheetReference, CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnRangeAst} from '../parser/Ast'
import {AddressWithColumn} from './common'
import {Transformer} from './Transformer'

export class RemoveColumnsTransformer extends Transformer {
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
    // Case 4
    if (this.columnsSpan.sheet !== formulaAddress.sheet && this.columnsSpan.sheet !== absoluteDependencySheet) {
      return false
    }

    // Case 3 -- removed column in same sheet where dependency is but formula in different
    if (this.columnsSpan.sheet !== formulaAddress.sheet && this.columnsSpan.sheet === absoluteDependencySheet) {
      const absoluteDependencyAddress = dependencyAddress.toSimpleColumnAddress(formulaAddress)
      if (absoluteDependencyAddress.col < this.columnsSpan.columnStart) { // 3.ARa
        return false
      } else if (absoluteDependencyAddress.col > this.columnsSpan.columnEnd) { // 3.ARb
        return dependencyAddress.shiftedByColumns(-this.columnsSpan.numberOfColumns) as T
      }
    }

    // Case 2 -- removed column in same sheet where formula but dependency in different sheet
    if (this.columnsSpan.sheet === formulaAddress.sheet && this.columnsSpan.sheet !== absoluteDependencySheet) {
      if (dependencyAddress.isColumnAbsolute()) { // 2.A
        return false
      } else {
        if (formulaAddress.col < this.columnsSpan.columnStart) { // 2.Ra
          return false
        } else if (formulaAddress.col > this.columnsSpan.columnEnd) { // 2.Rb
          return dependencyAddress.shiftedByColumns(this.columnsSpan.numberOfColumns) as T
        }
      }
    }

    // Case 1 -- same sheet
    if (this.columnsSpan.sheet === formulaAddress.sheet && this.columnsSpan.sheet === absoluteDependencySheet) {
      if (dependencyAddress.isColumnAbsolute()) {
        if (dependencyAddress.col < this.columnsSpan.columnStart) { // 1.Aa
          return false
        } else if (dependencyAddress.col > this.columnsSpan.columnEnd) { // 1.Ab
          return dependencyAddress.shiftedByColumns(-this.columnsSpan.numberOfColumns) as T
        }
      } else {
        const absoluteDependencyAddress = dependencyAddress.toSimpleColumnAddress(formulaAddress)
        if (absoluteDependencyAddress.col < this.columnsSpan.columnStart) {
          if (formulaAddress.col < this.columnsSpan.columnStart) { // 1.Raa
            return false
          } else if (formulaAddress.col > this.columnsSpan.columnEnd) { // 1.Rab
            return dependencyAddress.shiftedByColumns(this.columnsSpan.numberOfColumns) as T
          }
        } else if (absoluteDependencyAddress.col > this.columnsSpan.columnEnd) {
          if (formulaAddress.col < this.columnsSpan.columnStart) { // 1.Rba
            return dependencyAddress.shiftedByColumns(-this.columnsSpan.numberOfColumns) as T
          } else if (formulaAddress.col > this.columnsSpan.columnEnd) { // 1.Rbb
            return false
          }
        }
      }
    }

    // 1.Ac, 1.Rca, 1.Rcb, 3.Ac, 3.Rca, 3.Rcb
    return ErrorType.REF
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    if (this.columnsSpan.sheet === address.sheet && this.columnsSpan.columnStart <= address.col) {
      return {
        ...address,
        col: address.col - this.columnsSpan.numberOfColumns,
      }
    } else {
      return address
    }
  }

  private transformRange<T extends AddressWithColumn>(start: T, end: T, formulaAddress: SimpleCellAddress): [T, T] | ErrorType.REF | false {
    const startSheet = absoluteSheetReference(start, formulaAddress)

    let actualStart = start
    let actualEnd = end

    if (this.columnsSpan.sheet === startSheet) {
      const startSCA = start.toSimpleColumnAddress(formulaAddress)
      const endSCA = end.toSimpleColumnAddress(formulaAddress)

      if (this.columnsSpan.columnStart <= startSCA.col && this.columnsSpan.columnEnd >= endSCA.col) {
        return ErrorType.REF
      }

      if (startSCA.col >= this.columnsSpan.columnStart && startSCA.col <= this.columnsSpan.columnEnd) {
        actualStart = start.shiftedByColumns(this.columnsSpan.columnEnd - startSCA.col + 1) as T
      }

      if (endSCA.col >= this.columnsSpan.columnStart && endSCA.col <= this.columnsSpan.columnEnd) {
        actualEnd = end.shiftedByColumns(-(endSCA.col - this.columnsSpan.columnStart + 1)) as T
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