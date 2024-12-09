/**
 * @license
 * Copyright (c) 2024 Handsoncode. All rights reserved.
 */

import { AbsoluteCellRange } from '../../AbsoluteCellRange'
import { CellError, CellRange, ErrorType, simpleCellAddress } from '../../Cell'
import { ErrorMessage } from '../../error-message'
import { RowSearchStrategy } from '../../Lookup/RowSearchStrategy'
import { SearchOptions, SearchStrategy } from '../../Lookup/SearchStrategy'
import { ProcedureAst } from '../../parser'
import { StatType } from '../../statistics'
import { zeroIfEmpty } from '../ArithmeticHelper'
import { InterpreterState } from '../InterpreterState'
import { InternalScalarValue, InterpreterValue, RawNoErrorScalarValue } from '../InterpreterValue'
import { SimpleRangeValue } from '../../SimpleRangeValue'
import { FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions } from './FunctionPlugin'
import { ArraySize } from '../../ArraySize'

export class LookupPlugin extends FunctionPlugin implements FunctionPluginTypecheck<LookupPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'VLOOKUP': {
      method: 'vlookup',
      parameters: [
        { argumentType: FunctionArgumentType.NOERROR },
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
      ],
    },
    'HLOOKUP': {
      method: 'hlookup',
      parameters: [
        { argumentType: FunctionArgumentType.NOERROR },
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
      ]
    },
    'XLOOKUP': {
      method: 'xlookup',
      arraySizeMethod: 'xlookupArraySize',
      parameters: [
        // lookup_value
        { argumentType: FunctionArgumentType.NOERROR },
        // lookup_array
        { argumentType: FunctionArgumentType.RANGE },
        // return_array
        { argumentType: FunctionArgumentType.RANGE },
        // [if_not_found]
        { argumentType: FunctionArgumentType.SCALAR, optionalArg: true, defaultValue: ErrorType.NA },
        // [match_mode]
        { argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0 },
        // [search_mode]
        { argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 1 },
      ]
    },
    'MATCH': {
      method: 'match',
      parameters: [
        { argumentType: FunctionArgumentType.NOERROR },
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
      ]
    },
  }
  private rowSearch: RowSearchStrategy = new RowSearchStrategy(this.dependencyGraph)

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
   * @param state
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

  /**
   * Corresponds to XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
   * 
   * @param ast
   * @param state
   */
  public xlookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XLOOKUP'), (key: RawNoErrorScalarValue, lookupRangeValue: SimpleRangeValue, returnRangeValue: SimpleRangeValue, ifNotFound: any, matchMode: number, searchMode: number) => {      
      if (![0, -1, 1, 2].includes(matchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }
      
      if (![1, -1, 1, 2].includes(searchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }

      if (matchMode !== 0) {
        // not supported yet
        // TODO: Implement match mode
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }

      if (searchMode !== 1) {
        // not supported yet
        // TODO: Implement search mode
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }

      const lookupRange = lookupRangeValue instanceof SimpleRangeValue ? lookupRangeValue : SimpleRangeValue.fromScalar(lookupRangeValue)
      const returnRange = returnRangeValue instanceof SimpleRangeValue ? returnRangeValue : SimpleRangeValue.fromScalar(returnRangeValue)

      return this.doXlookup(zeroIfEmpty(key), lookupRange, returnRange, ifNotFound, matchMode, searchMode)
    })
  }

  public xlookupArraySize(ast: ProcedureAst): ArraySize {
    const lookupRange = ast?.args?.[1] as CellRange
    const returnRange  = ast?.args?.[2] as CellRange

    if (lookupRange?.start == null
      || lookupRange?.end == null
      || returnRange?.start == null
      || returnRange?.end == null
    ) {
      return ArraySize.error()
    }

    const lookupRangeHeight = lookupRange.end.row - lookupRange.start.row + 1
    const lookupRangeWidth = lookupRange.end.col - lookupRange.start.col + 1
    const returnRangeHeight = returnRange.end.row - returnRange.start.row + 1
    const returnRangeWidth = returnRange.end.col - returnRange.start.col + 1

    const isVerticalSearch = lookupRangeWidth === 1 && returnRangeHeight === lookupRangeHeight
    const isHorizontalSearch = lookupRangeHeight === 1 && returnRangeWidth === lookupRangeWidth

    if (!isVerticalSearch && !isHorizontalSearch) {
      return ArraySize.error()
    }

    if (isVerticalSearch) {
      return new ArraySize(returnRangeWidth, 1)
    }

    return new ArraySize(1, returnRangeHeight)
  }

  public match(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MATCH'), (key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, type: number) => {
      return this.doMatch(zeroIfEmpty(key), rangeValue, type)
    })
  }

  protected searchInRange(key: RawNoErrorScalarValue, range: SimpleRangeValue, sorted: boolean, searchStrategy: SearchStrategy): number {
    // for sorted option: use findInOrderedArray

    if (!sorted && typeof key === 'string' && this.arithmeticHelper.requiresRegex(key)) {
      return searchStrategy.advancedFind(
        this.arithmeticHelper.eqMatcherFunction(key),
        range
      )
    } else {
      const searchOptions: SearchOptions = sorted ? { ordering: 'asc' } : { ordering: 'none', matchExactly: true }
      return searchStrategy.find(key, range, searchOptions)
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

  private doXlookup(key: RawNoErrorScalarValue, lookupRange: SimpleRangeValue, returnRange: SimpleRangeValue, ifNotFound: any, matchMode: number, searchMode: number): InterpreterValue {
    const isVerticalSearch = lookupRange.width() === 1 && returnRange.height() === lookupRange.height()
    const isHorizontalSearch = lookupRange.height() === 1 && returnRange.width() === lookupRange.width()

    if (!isVerticalSearch && !isHorizontalSearch) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongDimension)
    }

    const searchStrategy = isVerticalSearch ? this.columnSearch : this.rowSearch
    const indexFound = this.searchInRange(key, lookupRange, false, searchStrategy)

    if (indexFound === -1) {
      return (ifNotFound == ErrorType.NA) ? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound) : ifNotFound
    }

    const returnValues: InternalScalarValue[][] = isVerticalSearch ? [returnRange.data[indexFound]] : returnRange.data.map((row) => [row[indexFound]])
    return SimpleRangeValue.onlyValues(returnValues)
  }

  private doMatch(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, type: number): InternalScalarValue {
    if (![-1, 0, 1].includes(type)) {
      return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
    }

    if (rangeValue.width() > 1 && rangeValue.height() > 1) {
      return new CellError(ErrorType.NA)
    }

    const searchStrategy = rangeValue.width() === 1 ? this.columnSearch : this.rowSearch
    const searchOptions: SearchOptions = type === 0
      ? { ordering: 'none', matchExactly: true }
      : { ordering: type === -1 ? 'desc' : 'asc' }
    const index = searchStrategy.find(key, rangeValue, searchOptions)

    if (index === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }
    return index + 1
  }
}
