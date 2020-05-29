/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, InternalCellValue, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {StatType} from '../../statistics'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class VlookupPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'VLOOKUP': {
      method: 'vlookup',
    },
    'MATCH': {
      method: 'match',
    },
  }

  /**
   * Corresponds to VLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public vlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 3 || ast.args.length > 4) {
      return new CellError(ErrorType.NA)
    }

    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
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

    let sorted: InternalCellValue = true
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

  public match(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
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
      const columnIndex = this.searchInRange(key, searchedRange, false)
      if (columnIndex === -1) {
        return new CellError(ErrorType.NA)
      }

      return (columnIndex-searchedRange.start.row) + 1
    }
  }

  private searchInRange(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    if(!sorted && typeof key === 'string' && this.interpreter.arithmeticHelper.requiresRegex(key)) {
      return this.columnSearch.advancedFind(
        this.interpreter.arithmeticHelper.eqMatcherFunction(key),
        range
      )
    } else {
      return this.columnSearch.find(key, range, sorted)
    }
  }

  private doVlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): InternalCellValue {
    this.dependencyGraph.stats.start(StatType.VLOOKUP)

    const searchedRange = AbsoluteCellRange.spanFrom(range.start, 1, range.height())
    const rowIndex = this.searchInRange(key, searchedRange, sorted)

    this.dependencyGraph.stats.end(StatType.VLOOKUP)

    if (rowIndex === -1) {
      return new CellError(ErrorType.NA)
    }

    const address = simpleCellAddress(range.sheet, range.start.col + index, rowIndex)

    return this.dependencyGraph.getCellValue(address)
  }
}
