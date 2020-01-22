import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {StatType} from '../../statistics/Statistics'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class VlookupPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    vlookup: {
      translationKey: 'VLOOKUP',
    },
    match: {
      translationKey: 'MATCH',
    },
  }

  /**
   * Corresponds to VLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public vlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 3 || ast.args.length > 4) {
      return new CellError(ErrorType.NA)
    }

    const key = this.evaluateAst(ast.args[0], formulaAddress)
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean') {
      return new CellError(ErrorType.VALUE)
    }

    const rangeArg = ast.args[1]
    if (rangeArg.type !== AstNodeType.CELL_RANGE) {
      /* gsheet returns REF */
      return new CellError(ErrorType.VALUE)
    }

    const index = this.evaluateAst(ast.args[2], formulaAddress)
    if (typeof index !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    let sorted: CellValue = true
    if (ast.args.length === 4) {
      const computedSorted = this.evaluateAst(ast.args[3], formulaAddress)
      if (typeof computedSorted === 'boolean') {
        sorted = computedSorted
      } else {
        return new CellError(ErrorType.VALUE)
      }
    }

    const range = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)
    if (index > range.width()) {
      return new CellError(ErrorType.REF)
    }

    return this.doVlookup(key, range, index - 1, sorted)
  }

  public match(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }

    const key = this.evaluateAst(ast.args[0], formulaAddress)
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean') {
      return new CellError(ErrorType.VALUE)
    }

    const rangeArg = ast.args[1]
    if (rangeArg.type !== AstNodeType.CELL_RANGE) {
      return new CellError(ErrorType.VALUE)
    }

    let sorted: InterpreterValue = 1
    if (ast.args.length === 3) {
      sorted = this.evaluateAst(ast.args[2], formulaAddress)
      if (typeof sorted !== 'number') {
        return new CellError(ErrorType.VALUE)
      }
    }

    const searchedRange = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)

    if (searchedRange.width() === 1) {
      const rowIndex = this.columnSearch.find(key, searchedRange, sorted !== 0)

      if (rowIndex === -1) {
        return new CellError(ErrorType.NA)
      }

      return rowIndex - searchedRange.start.row + 1
    } else {
      const valuesInRange = this.computeListOfValuesInRange(searchedRange)
      const columnIndex = valuesInRange.indexOf(key)

      if (columnIndex === -1) {
        return new CellError(ErrorType.NA)
      }

      return columnIndex + 1
    }
  }

  private doVlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): CellValue {
    this.dependencyGraph.stats.start(StatType.VLOOKUP)

    const searchedRange = AbsoluteCellRange.spanFrom(range.start, 1, range.height())
    const rowIndex = this.columnSearch.find(key, searchedRange, sorted)

    this.dependencyGraph.stats.end(StatType.VLOOKUP)

    if (rowIndex === -1) {
      return new CellError(ErrorType.NA)
    }

    const address = simpleCellAddress(range.sheet, range.start.col + index, rowIndex)

    return this.dependencyGraph.getCellValue(address)
  }
}
