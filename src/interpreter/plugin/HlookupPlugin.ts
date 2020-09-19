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
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'
import {rangeLowerBound} from '../binarySearch'

export class HlookupPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'HLOOKUP': {
      method: 'hlookup',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR},
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.BOOLEAN, defaultValue: true},
      ]
    },
  }

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

  private doHlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): InternalScalarValue {
    const searchedRange = AbsoluteCellRange.spanFrom(range.start, range.width(), 1)
    const colIndex = this.searchInRange(key, searchedRange, sorted)

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
