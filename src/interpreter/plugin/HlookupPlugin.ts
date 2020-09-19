/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {
  CellError,
  ErrorType, InternalNoErrorCellValue,
  InternalScalarValue,
  simpleCellAddress,
  SimpleCellAddress
} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {StatType} from '../../statistics'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'
import {rangeLowerBound} from '../binarySearch'

export class HlookupPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'HLOOKUP': {
      method: 'hlookup',
    },
  }

  /**
   * Corresponds to VLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public hlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InterpreterValue {
    if (ast.args.length < 3 || ast.args.length > 4) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM, ErrorMessage.EmptyArg )
    }

    const key = this.evaluateAst(ast.args[0], formulaAddress)
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean') {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    const rangeArg = ast.args[1]
    if (rangeArg.type !== AstNodeType.CELL_RANGE) {
      /* gsheet returns REF */
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    const index = this.evaluateAst(ast.args[2], formulaAddress)
    if (typeof index !== 'number') {
      return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
    }

    let sorted: InternalScalarValue = true
    if (ast.args.length === 4) {
      const computedSorted = this.evaluateAst(ast.args[3], formulaAddress)
      if (typeof computedSorted === 'boolean') {
        sorted = computedSorted
      } else {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
    }

    const range = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)
    if (index > range.height()) {
      return new CellError(ErrorType.REF, ErrorMessage.IndexLarge)
    }

    return this.doHlookup(key, range, index - 1, sorted)
  }

  private doHlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): InterpreterValue {
    const searchedRange = AbsoluteCellRange.spanFrom(range.start, range.width(), 1)
    const colIndex = this.searchInRange(key, searchedRange, sorted)

    if (colIndex === -1) {
      return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
    }

    const address = simpleCellAddress(range.sheet, colIndex, range.start.row + index)

    return this.dependencyGraph.getCellValue(address)
  }

  private searchInRange(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    if(!sorted && typeof key === 'string' && this.interpreter.arithmeticHelper.requiresRegex(key)) {
      return this.advancedFind(
        this.interpreter.arithmeticHelper.eqMatcherFunction(key),
        range
      )
    } else {
      return this.find(key, range, sorted)
    }
  }

  public find(key: InternalNoErrorCellValue, range: AbsoluteCellRange, sorted: boolean): number {
    if (range.width() < this.config.vlookupThreshold || !sorted) {
      const values = this.computeListOfValuesInRange(range)
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.col
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'col')
    }
  }

  public advancedFind(keyMatcher: (arg: InternalScalarValue) => boolean, range: AbsoluteCellRange): number {
    const values = this.computeListOfValuesInRange(range)
    for(let i=0; i<values.length; i++) {
      if(keyMatcher(values[i])) {
        return i + range.start.col
      }
    }
    return -1
  }
}
