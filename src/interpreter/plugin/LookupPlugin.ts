/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {RowSearchStrategy} from '../../Lookup/RowSearchStrategy'
import {SearchStrategy} from '../../Lookup/SearchStrategy'
import {ProcedureAst} from '../../parser'
import {StatType} from '../../statistics'
import {zeroIfEmpty} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue, InterpreterValue, RawNoErrorScalarValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class LookupPlugin extends FunctionPlugin implements FunctionPluginTypecheck<LookupPlugin> {
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
  private rowSearch: RowSearchStrategy = new RowSearchStrategy(this.config, this.dependencyGraph)

  /**
   * Corresponds to VLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param state
   */
  public vlookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VLOOKUP'), (key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean) => {
      const range = rangeValue.range

      if (range === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      if (index < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (index > range.width()) {
        return new CellError(ErrorType.REF, ErrorMessage.IndexLarge)
      }

      return this.doVlookup(zeroIfEmpty(key), rangeValue, index - 1, sorted)
    })
  }

  /**
   * Corresponds to HLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public hlookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HLOOKUP'), (key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean) => {
      const range = rangeValue.range
      if (range === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      if (index < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (index > range.height()) {
        return new CellError(ErrorType.REF, ErrorMessage.IndexLarge)
      }

      return this.doHlookup(zeroIfEmpty(key), rangeValue, index - 1, sorted)
    })
  }

  public match(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MATCH'), (key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, sorted: number) => {
      return this.doMatch(zeroIfEmpty(key), rangeValue, sorted)
    })
  }

  protected searchInRange(key: RawNoErrorScalarValue, range: SimpleRangeValue, sorted: boolean, searchStrategy: SearchStrategy): number {
    if (!sorted && typeof key === 'string' && this.arithmeticHelper.requiresRegex(key)) {
      return searchStrategy.advancedFind(
        this.arithmeticHelper.eqMatcherFunction(key),
        range
      )
    } else {
      return searchStrategy.find(key, range, sorted)
    }
  }

  private doVlookup(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean): InternalScalarValue {
    this.dependencyGraph.stats.start(StatType.VLOOKUP)
    const range = rangeValue.range
    let searchedRange
    if (range === undefined) {
      searchedRange = SimpleRangeValue.onlyValues(rangeValue.data.map((arg) => [arg[0]]))
    } else {
      searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(range.start, 1, range.height()), this.dependencyGraph)
    }
    const rowIndex = this.searchInRange(key, searchedRange, sorted, this.columnSearch)

    this.dependencyGraph.stats.end(StatType.VLOOKUP)

    if (rowIndex === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }

    let value
    if (range === undefined) {
      value = rangeValue.data[rowIndex][index]
    } else {
      const address = simpleCellAddress(range.sheet, range.start.col + index, range.start.row + rowIndex)
      value = this.dependencyGraph.getCellValue(address)
    }

    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }
    return value
  }

  private doHlookup(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, index: number, sorted: boolean): InternalScalarValue {
    const range = rangeValue.range
    let searchedRange
    if (range === undefined) {
      searchedRange = SimpleRangeValue.onlyValues([rangeValue.data[0]])
    } else {
      searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(range.start, range.width(), 1), this.dependencyGraph)
    }
    const colIndex = this.searchInRange(key, searchedRange, sorted, this.rowSearch)

    if (colIndex === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }

    let value
    if (range === undefined) {
      value = rangeValue.data[index][colIndex]
    } else {
      const address = simpleCellAddress(range.sheet, range.start.col + colIndex, range.start.row + index)
      value = this.dependencyGraph.getCellValue(address)
    }

    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }
    return value
  }

  private doMatch(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, sorted: number): InternalScalarValue {
    if (rangeValue.width() > 1 && rangeValue.height() > 1) {
      return new CellError(ErrorType.NA)
    }
    if (rangeValue.width() === 1) {
      const index = this.columnSearch.find(key, rangeValue, sorted !== 0)
      if (index === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }
      return index + 1
    } else {
      const index = this.rowSearch.find(key, rangeValue, sorted !== 0)
      if (index === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }
      return index + 1
    }
  }
}
