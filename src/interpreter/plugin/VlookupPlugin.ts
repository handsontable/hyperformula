/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {
  CellError,
  ErrorType,
  InternalNoErrorCellValue,
  InternalScalarValue,
  simpleCellAddress,
  SimpleCellAddress
} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {StatType} from '../../statistics'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'
import {SearchStrategy} from '../../Lookup/SearchStrategy'
import {RowSearchStrategy} from '../../Lookup/RowSearchStrategy'

export class VlookupPlugin extends FunctionPlugin {
  private rowSearchStrategy: RowSearchStrategy = new RowSearchStrategy(this.config, this.dependencyGraph)

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
    'HLOOKUP': {
      method: 'hlookup',
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

  /**
   * Corresponds to HLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public hlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HLOOKUP'), (key: InterpreterValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean) => {
      const range = rangeValue.range()
      if (range === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      if (index > range.height()) {
        return new CellError(ErrorType.REF, ErrorMessage.IndexLarge)
      }

      return this.doHlookup(key, range, index - 1, sorted)
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
    const rowIndex = this.searchInRange(key, searchedRange, sorted, this.columnSearch)

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

  private doHlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): InternalScalarValue {
    const searchedRange = AbsoluteCellRange.spanFrom(range.start, range.width(), 1)
    const colIndex = this.searchInRange(key, searchedRange, sorted, this.rowSearchStrategy)

    if (colIndex === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }

    const address = simpleCellAddress(range.sheet, colIndex, range.start.row + index)

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
      const columnIndex = this.searchInRange(key, range, false, this.columnSearch)
      if (columnIndex === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }

      return (columnIndex - range.start.row) + 1
    }
  }

  protected searchInRange(key: InternalNoErrorCellValue, range: AbsoluteCellRange, sorted: boolean, searchStrategy: SearchStrategy): number {
    if(!sorted && typeof key === 'string' && this.interpreter.arithmeticHelper.requiresRegex(key)) {
      return searchStrategy.advancedFind(
        this.interpreter.arithmeticHelper.eqMatcherFunction(key),
        range
      )
    } else {
      return searchStrategy.find(key, range, sorted)
    }
  }
}
