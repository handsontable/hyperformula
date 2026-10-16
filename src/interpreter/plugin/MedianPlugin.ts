/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue, RawScalarValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MedianPlugin> {

  public static implementedFunctions: ImplementedFunctions = {
    'MEDIAN': {
      method: 'median',
      parameters: [
        {argumentType: FunctionArgumentType.ANY},
      ],
      repeatLastArgs: 1,
    },
    'LARGE': {
      method: 'large',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1},
      ],
    },
    'SMALL': {
      method: 'small',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1},
      ],
    },
    'RANK.AVG': {
      method: 'rankAvg',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0},
      ],
    },
  }

  /**
   * Corresponds to MEDIAN(Number1, Number2, ...).
   *
   * Returns a median of given numbers.
   *
   * @param ast
   * @param state
   */
  public median(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MEDIAN'),
      (...args: RawScalarValue[]) => {
        const values = this.arithmeticHelper.coerceNumbersExactRanges(args)
        if (values instanceof CellError) {
          return values
        }
        if (values.length === 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        values.sort((a, b) => (a - b))
        if (values.length % 2 === 0) {
          return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
        } else {
          return values[Math.floor(values.length / 2)]
        }
      })
  }

  public large(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LARGE'),
      (range: SimpleRangeValue, n: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        vals.sort((a, b) => a - b)
        n = Math.trunc(n)
        if (n > vals.length) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return vals[vals.length - n]
      }
    )
  }

  public small(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SMALL'),
      (range: SimpleRangeValue, n: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        vals.sort((a, b) => a - b)
        n = Math.trunc(n)
        if (n > vals.length) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return vals[n - 1]
      }
    )
  }

  /**
   * Corresponds to RANK.AVG(number, ref, [order]).
   *
   * Returns the rank of a number in a range of numbers. Tied values get the average of the ranks they span.
   * The rank is descending when order is 0 or omitted, and ascending for any other order.
   *
   * @param ast
   * @param state
   */
  public rankAvg(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('RANK.AVG'),
      (value: number, range: SimpleRangeValue, order: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        const ties = vals.filter(val => val === value).length
        if (ties === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
        }
        const ranksBefore = vals.filter(val => order === 0 ? val > value : val < value).length
        return ranksBefore + (ties + 1) / 2
      }
    )
  }
}
