/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {
  CellError,
  ErrorType,
  InternalScalarValue,
  simpleCellAddress,
  SimpleCellAddress
} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {StatType} from '../../statistics'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class VlookupPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'VLOOKUP': {
      method: 'vlookup',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR},
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.BOOLEAN, defaultValue: true},
      ]
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
  public vlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('VLOOKUP'), (key: InterpreterValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean) => {
      const range = rangeValue.range()
      if (range === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      if (index > range.width()) {
        return new CellError(ErrorType.REF, ErrorMessage.IndexLarge)
      }

      return this.doVlookup(key, range, index - 1, sorted)
    })
  }

  public match(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const key = this.evaluateAst(ast.args[0], formulaAddress)
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean') {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    const rangeArg = ast.args[1]
    if (rangeArg.type !== AstNodeType.CELL_RANGE) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    let sorted: InterpreterValue = 1
    if (ast.args.length === 3) {
      sorted = this.evaluateAst(ast.args[2], formulaAddress)
      if (typeof sorted !== 'number') {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
    }

    const searchedRange = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)

    if (searchedRange.width() === 1) {
      const rowIndex = this.columnSearch.find(key, searchedRange, sorted !== 0)

      if (rowIndex === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }

      return rowIndex - searchedRange.start.row + 1
    } else {
      const columnIndex = this.searchInRange(key, searchedRange, false)
      if (columnIndex === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
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

  private doVlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): InternalScalarValue {
    this.dependencyGraph.stats.start(StatType.VLOOKUP)

    const searchedRange = AbsoluteCellRange.spanFrom(range.start, 1, range.height())
    const rowIndex = this.searchInRange(key, searchedRange, sorted)

    this.dependencyGraph.stats.end(StatType.VLOOKUP)

    if (rowIndex === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }

    const address = simpleCellAddress(range.sheet, range.start.col + index, rowIndex)
    const value = this.dependencyGraph.getCellValue(address)

    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }
    return value
  }
}
