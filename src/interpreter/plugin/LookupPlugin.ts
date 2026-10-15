/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import { AbsoluteCellRange } from '../../AbsoluteCellRange'
import { CellError, CellRange, ErrorType, SimpleCellAddress, simpleCellAddress } from '../../Cell'
import { ErrorMessage } from '../../error-message'
import { RowSearchStrategy } from '../../Lookup/RowSearchStrategy'
import { SearchOptions, SearchStrategy } from '../../Lookup/SearchStrategy'
import { AstNodeType, ProcedureAst } from '../../parser'
import { StatType } from '../../statistics'
import { forceNormalizeString, zeroIfEmpty } from '../ArithmeticHelper'
import { findLastOccurrenceInOrderedArray } from '../binarySearch'
import { InterpreterState } from '../InterpreterState'
import { EmptyValue, getRawValue, InternalScalarValue, InterpreterValue, RawNoErrorScalarValue } from '../InterpreterValue'
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
      sizeOfResultArrayMethod: 'xlookupArraySize',
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
    'XMATCH': {
      method: 'xmatch',
      enableArrayArithmeticForArguments: true,
      parameters: [
        // lookup_value
        { argumentType: FunctionArgumentType.NOERROR },
        // lookup_array
        { argumentType: FunctionArgumentType.RANGE },
        // [match_mode]
        { argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0 },
        // [search_mode]
        { argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 1 },
      ]
    },
    'LOOKUP': {
      method: 'lookup',
      enableArrayArithmeticForArguments: true,
      parameters: [
        // lookup_value
        { argumentType: FunctionArgumentType.NOERROR },
        // lookup_vector
        { argumentType: FunctionArgumentType.RANGE },
        // [result_vector]
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
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

      const searchOptions: SearchOptions = {
        ordering: sorted ? 'asc' : 'none',
        ifNoMatch: sorted ? 'returnLowerBound' : 'returnNotFound'
      }

      return this.doVlookup(zeroIfEmpty(key), rangeValue, index - 1, searchOptions)
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

      const searchOptions: SearchOptions = {
        ordering: sorted ? 'asc' : 'none',
        ifNoMatch: sorted ? 'returnLowerBound' : 'returnNotFound'
      }

      return this.doHlookup(zeroIfEmpty(key), rangeValue, index - 1, searchOptions)
    })
  }

  /**
   * Corresponds to XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
   *
   * @param ast
   * @param state
   */
  public xlookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XLOOKUP'), (key: RawNoErrorScalarValue, lookupRangeValue: SimpleRangeValue, returnRangeValue: SimpleRangeValue, notFoundFlag: any, matchMode: number, searchMode: number) => {
      if (![0, -1, 1, 2].includes(matchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }

      if (![1, -1, 2, -2].includes(searchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }

      const lookupRange = lookupRangeValue instanceof SimpleRangeValue ? lookupRangeValue : SimpleRangeValue.fromScalar(lookupRangeValue)
      const returnRange = returnRangeValue instanceof SimpleRangeValue ? returnRangeValue : SimpleRangeValue.fromScalar(returnRangeValue)
      const isWildcardMatchMode = matchMode === 2

      return this.doXlookup(zeroIfEmpty(key), lookupRange, returnRange, notFoundFlag, isWildcardMatchMode, this.buildSearchOptions(matchMode, searchMode))
    })
  }

  /**
   * Corresponds to XMATCH(lookup_value, lookup_array, [match_mode], [search_mode])
   *
   * `match_mode` 3 is accepted and behaves like an exact match, as in Excel.
   *
   * @param ast
   * @param state
   */
  public xmatch(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XMATCH'), (key: RawNoErrorScalarValue, lookupRange: SimpleRangeValue, matchMode: number, searchMode: number) => {
      if (![0, -1, 1, 2, 3].includes(matchMode) || ![1, -1, 2, -2].includes(searchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
      }

      if (lookupRange.width() > 1 && lookupRange.height() > 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongDimension)
      }

      const searchStrategy = lookupRange.width() === 1 ? this.columnSearch : this.rowSearch
      const indexFound = this.searchInRange(key, lookupRange, matchMode === 2, this.buildSearchOptions(matchMode, searchMode), searchStrategy)

      return indexFound === -1 ? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound) : indexFound + 1
    })
  }

  /**
   * Corresponds to LOOKUP(lookup_value, lookup_vector, [result_vector])
   *
   * Only the items of the `lookup_value` type take part in the search, so numbers, text and booleans of mixed
   * data are never compared with each other. A `lookup_vector` that is wider than it is tall is searched along
   * its first row, any other along its first column. Without `result_vector` the result is read from the last
   * row (or column) of `lookup_vector`; a `result_vector` is read from its first cell onwards and a position past
   * its end is #N/A, so that the result depends only on the cells the formula refers to.
   *
   * @param ast
   * @param state
   */
  public lookup(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOOKUP'), (key: RawNoErrorScalarValue, lookupVector: SimpleRangeValue, resultVector?: SimpleRangeValue) => {
      const isSearchedAlongRow = lookupVector.width() > lookupVector.height()
      const position = this.findLastNotGreaterOfSameType(key, this.lineOf(lookupVector, isSearchedAlongRow, 0))

      if (position === -1) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }

      const value = resultVector === undefined
        ? (isSearchedAlongRow ? this.cellAt(lookupVector, lookupVector.height() - 1, position) : this.cellAt(lookupVector, position, lookupVector.width() - 1))
        : (this.isColumnVector(resultVector, isSearchedAlongRow) ? this.cellAt(resultVector, position, 0) : this.cellAt(resultVector, 0, position))

      if (value === undefined) {
        return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
      }

      if (value instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }

      return this.zeroIfEmptyResult(value)
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

  protected searchInRange(key: RawNoErrorScalarValue, range: SimpleRangeValue, isWildcardMatchMode: boolean, searchOptions: SearchOptions, searchStrategy: SearchStrategy): number {
    if (isWildcardMatchMode && typeof key === 'string' && this.arithmeticHelper.requiresRegex(key)) {
      return searchStrategy.advancedFind(
        this.arithmeticHelper.eqMatcherFunction(key),
        range,
        { returnOccurrence: searchOptions.returnOccurrence }
      )
    }

    return searchStrategy.find(key, range, searchOptions)
  }

  private buildSearchOptions(matchMode: number, searchMode: number): SearchOptions {
    return {
      ordering: searchMode === 2 ? 'asc' : searchMode === -2 ? 'desc' : 'none',
      returnOccurrence: searchMode === -1 ? 'last' : 'first',
      ifNoMatch: matchMode === -1
        ? 'returnLowerBound'
        : matchMode === 1
          ? 'returnUpperBound'
          : 'returnNotFound'
    }
  }

  /**
   * Returns the position (in `values`) of the last item of the `key` type that is not greater than `key`,
   * assuming that the items of that type are sorted ascending; -1 if there is none. An empty `key` matches nothing.
   */
  private findLastNotGreaterOfSameType(key: RawNoErrorScalarValue, values: InternalScalarValue[]): number {
    if (key === EmptyValue) {
      return -1
    }

    const normalize = (value: RawNoErrorScalarValue) => typeof value === 'string' ? forceNormalizeString(value) : value
    const positions: number[] = []
    const comparableValues: RawNoErrorScalarValue[] = []

    values.forEach((cell, position) => {
      const value = getRawValue(cell)
      if (typeof value === typeof key) {
        positions.push(position)
        comparableValues.push(normalize(value as RawNoErrorScalarValue))
      }
    })

    const found = findLastOccurrenceInOrderedArray(normalize(key), comparableValues)
    return found === -1 ? -1 : positions[found]
  }

  /**
   * Returns the cells of the row (`isRow`) or the column number `index` of the range value.
   */
  private lineOf(rangeValue: SimpleRangeValue, isRow: boolean, index: number): InternalScalarValue[] {
    const range = rangeValue.range

    if (range === undefined) {
      return isRow ? rangeValue.data[index] : rangeValue.data.map((row) => row[index])
    }

    const start = simpleCellAddress(range.sheet, range.start.col + (isRow ? 0 : index), range.start.row + (isRow ? index : 0))
    return this.dependencyGraph.computeListOfValuesInRange(AbsoluteCellRange.spanFrom(start, isRow ? range.width() : 1, isRow ? 1 : range.height()))
  }

  /**
   * Returns the value at the given offset from the top-left corner of the range value, or `undefined` when the
   * offset lies outside of it, so that only cells the formula refers to are read.
   */
  private cellAt(rangeValue: SimpleRangeValue, row: number, col: number): InterpreterValue | undefined {
    const range = rangeValue.range

    if (range === undefined) {
      return rangeValue.data[row]?.[col]
    }

    if (row >= range.height() || col >= range.width()) {
      return undefined
    }

    return this.dependencyGraph.getCellValue(simpleCellAddress(range.sheet, range.start.col + col, range.start.row + row))
  }

  /**
   * A single cell takes the orientation of the searched vector; any other range, its own.
   */
  private isColumnVector(rangeValue: SimpleRangeValue, isSearchedAlongRow: boolean): boolean {
    return rangeValue.width() === 1 && (rangeValue.height() > 1 || !isSearchedAlongRow)
  }

  private doVlookup(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, index: number, searchOptions: SearchOptions): InternalScalarValue {
    this.dependencyGraph.stats.start(StatType.VLOOKUP)
    const range = rangeValue.range
    let searchedRange
    if (range === undefined) {
      searchedRange = SimpleRangeValue.onlyValues(rangeValue.data.map((arg) => [arg[0]]))
    } else {
      searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(range.start, 1, range.height()), this.dependencyGraph)
    }
    const rowIndex = this.searchInRange(key, searchedRange, searchOptions.ordering === 'none', searchOptions, this.columnSearch)

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
    return this.zeroIfEmptyResult(value)
  }

  private doHlookup(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, index: number, searchOptions: SearchOptions): InternalScalarValue {
    const range = rangeValue.range
    let searchedRange
    if (range === undefined) {
      searchedRange = SimpleRangeValue.onlyValues([rangeValue.data[0]])
    } else {
      searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(range.start, range.width(), 1), this.dependencyGraph)
    }
    const colIndex = this.searchInRange(key, searchedRange, searchOptions.ordering === 'none', searchOptions, this.rowSearch)

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
    return this.zeroIfEmptyResult(value)
  }

  /**
   * Excel returns 0 (not blank) for a matched cell that is empty — a reference to an empty cell coerces
   * to 0 in Excel. Mirror that on the lookup RETURN value so VLOOKUP/HLOOKUP/XLOOKUP match Excel.
   *
   * Same rule as `ArithmeticHelper.zeroIfEmpty`, kept as a separate method because the lookup RETURN
   * value is an `InternalScalarValue` (wider than that helper's `RawNoErrorScalarValue` parameter).
   */
  private zeroIfEmptyResult(value: InternalScalarValue): InternalScalarValue {
    return value === EmptyValue ? 0 : value
  }

  private doXlookup(key: RawNoErrorScalarValue, lookupRange: SimpleRangeValue, returnRange: SimpleRangeValue, notFoundFlag: any, isWildcardMatchMode: boolean, searchOptions: SearchOptions): InterpreterValue {
    const isVerticalSearch = lookupRange.width() === 1 && returnRange.height() === lookupRange.height()
    const isHorizontalSearch = lookupRange.height() === 1 && returnRange.width() === lookupRange.width()

    if (!isVerticalSearch && !isHorizontalSearch) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongDimension)
    }

    const searchStrategy = isVerticalSearch ? this.columnSearch : this.rowSearch
    const indexFound = this.searchInRange(key, lookupRange, isWildcardMatchMode, searchOptions, searchStrategy)

    if (indexFound === -1) {
      return (notFoundFlag == ErrorType.NA) ? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound) : notFoundFlag
    }

    const returnValues: InternalScalarValue[][] = isVerticalSearch ? [returnRange.data[indexFound]] : returnRange.data.map((row) => [row[indexFound]])
    const coerced = returnValues.map((row) => row.map((value) => this.zeroIfEmptyResult(value)))
    return SimpleRangeValue.onlyValues(coerced)
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
      ? { ordering: 'none', ifNoMatch: 'returnNotFound' }
      : { ordering: type === -1 ? 'desc' : 'asc', ifNoMatch: type === -1 ? 'returnUpperBound' : 'returnLowerBound' }
    const index = searchStrategy.find(key, rangeValue, searchOptions)

    if (index === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }
    return index + 1
  }
}
