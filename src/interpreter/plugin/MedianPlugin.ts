/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue, RawScalarValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MedianPlugin> {

  public static implementedFunctions = {
    'MEDIAN': {
      method: 'median',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1,
    },
    'LARGE': {
      method: 'large',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
    },
    'SMALL': {
      method: 'small',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
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
}
