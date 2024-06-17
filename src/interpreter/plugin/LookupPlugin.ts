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
      ]
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
      vectorizationForbidden: true,
      parameters: [
        // lookup_value
        { argumentType: FunctionArgumentType.NOERROR },
        // lookup_array
        { argumentType: FunctionArgumentType.RANGE },
        // return_array
        { argumentType: FunctionArgumentType.RANGE },
        // [if_not_found]
        { argumentType: FunctionArgumentType.STRING, optionalArg: true, defaultValue: ErrorType.NA },
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
      const lookupRange = lookupRangeValue.range
      const returnRange = returnRangeValue.range

      if (lookupRange === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      if (returnRange === undefined) {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
      if (ifNotFound !== ErrorType.NA && typeof ifNotFound !== 'string') {
        return new CellError(ErrorType.VALUE, ErrorMessage.NoConditionMet)
      }
      if (![0, -1, 1, 2].includes(matchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NoConditionMet)
      }
      if (![1, -1, 1, 2].includes(searchMode)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NoConditionMet)
      }

      // TODO - Implement all options - until then, return NotSupported
      if (matchMode !== 0) {
        return new CellError(ErrorType.NAME, ErrorMessage.FunctionName('XLOOKUP'))
      }
      if (searchMode !== 1) {
        return new CellError(ErrorType.NAME, ErrorMessage.FunctionName('XLOOKUP'))
      }

      return this.doXlookup(zeroIfEmpty(key), lookupRangeValue, returnRangeValue, ifNotFound, matchMode, searchMode)
    })
  }

  public xlookupArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    const lookupRangeValue = ast?.args?.[1] as CellRange
    const returnRangeValue = ast?.args?.[2] as CellRange
    const searchWidth = lookupRangeValue.end.col - lookupRangeValue.start.col + 1 

    if (returnRangeValue?.start == null || returnRangeValue?.end == null) {
      return ArraySize.scalar()
    }

    if (searchWidth === 1) {
      // column search
      const outputWidth = returnRangeValue.end.col - returnRangeValue.start.col + 1 
      return new ArraySize(outputWidth, 1)
    } else {
      // row search
      const outputHeight = returnRangeValue.end.row - returnRangeValue.start.row + 1 
      return new ArraySize(1, outputHeight)
    }
  }

  public match(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MATCH'), (key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, type: number) => {
      return this.doMatch(zeroIfEmpty(key), rangeValue, type)
    })
  }

  protected searchInRange(key: RawNoErrorScalarValue, range: SimpleRangeValue, sorted: boolean, searchStrategy: SearchStrategy): number {
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

  private doXlookup(key: RawNoErrorScalarValue, lookupAbsRangeValue: SimpleRangeValue, absReturnRangeValue: SimpleRangeValue, ifNotFound: any, matchMode: number, searchMode: number): InterpreterValue {
    const lookupAbsRange = lookupAbsRangeValue.range
    const absReturnRange = absReturnRangeValue.range
    if (lookupAbsRange === undefined || absReturnRange === undefined) {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    if (lookupAbsRange.start.col === lookupAbsRange.end.col && lookupAbsRange.start.row <= lookupAbsRange.end.row) {
      // single column
      const searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(lookupAbsRange.start, 1, lookupAbsRange.height()), this.dependencyGraph)
      const rowIndex = this.searchInRange(key, searchedRange, false, this.columnSearch)
      if (rowIndex === -1) {
        return (ifNotFound == ErrorType.NA) ? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound) : ifNotFound
      }
      const topLeft = { sheet: absReturnRange.sheet, col: absReturnRange.start.col, row: absReturnRange.start.row + rowIndex }
      const width = absReturnRange.end.col - absReturnRange.start.col + 1

      return SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(topLeft, width, 1), this.dependencyGraph)
    } else if (lookupAbsRange.start.row === lookupAbsRange.end.row && lookupAbsRange.start.col <= lookupAbsRange.end.col) {
      // single row
      const searchedRange = SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(lookupAbsRange.start, lookupAbsRange.width(), 1), this.dependencyGraph)
      const colIndex = this.searchInRange(key, searchedRange, false, this.rowSearch)

      if (colIndex === -1) {
        return (ifNotFound == ErrorType.NA) ? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound) : ifNotFound
      }

      const topLeft = { sheet: absReturnRange.sheet, col: absReturnRange.start.col + colIndex, row: absReturnRange.start.row }
      const height = absReturnRange.end.row - absReturnRange.start.row + 1
      return SimpleRangeValue.onlyRange(AbsoluteCellRange.spanFrom(topLeft, 1, height), this.dependencyGraph)
    } else {
      // multiple rows and tables - not supported
      return new CellError(ErrorType.VALUE, ErrorMessage.CellRangeExpected)
    }
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
