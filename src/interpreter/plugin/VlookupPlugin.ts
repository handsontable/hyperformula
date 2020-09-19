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
        {argumentType: ArgumentTypes.NOERROR},
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.BOOLEAN, defaultValue: true},
      ]
    },
    'MATCH': {
      method: 'match',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR},
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
  }

  /**
   * Corresponds to VLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public vlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('VLOOKUP'), (key: InternalScalarValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean) => {
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('MATCH'), (key: InternalScalarValue, rangeValue: SimpleRangeValue, sorted: number) => {
      const range = rangeValue.range()
      if (range === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }

      return this.doMatch(key, range, sorted)
    })
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

  private doMatch(key: any, range: AbsoluteCellRange, sorted: number): InternalScalarValue {
    if (range.width() === 1) {
      const rowIndex = this.columnSearch.find(key, range, sorted !== 0)

      if (rowIndex === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }

      return rowIndex - range.start.row + 1
    } else {
      const columnIndex = this.searchInRange(key, range, false)
      if (columnIndex === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }

      return (columnIndex - range.start.row) + 1
    }
  }

  private searchInRange(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    if (!sorted && typeof key === 'string' && this.interpreter.arithmeticHelper.requiresRegex(key)) {
      return this.columnSearch.advancedFind(
        this.interpreter.arithmeticHelper.eqMatcherFunction(key),
        range
      )
    } else {
      return this.columnSearch.find(key, range, sorted)
    }
  }
}
