/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue, isExtendedNumber, RawScalarValue} from '../InterpreterValue'
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
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
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
    // Excel ignores empty, text and logical values reached through a single-cell reference, as it already
    // does for a range; only explicitly typed arguments are coerced (so a blank cell must not count as 0).
    const args = ast.args.filter((arg) => {
      if (arg.type !== AstNodeType.CELL_REFERENCE) {
        return true
      }
      const value = this.evaluateAst(arg, state)
      return value instanceof CellError || isExtendedNumber(value)
    })
    if (ast.args.length > 0 && args.length === 0) {
      return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
    }
    return this.runFunction(args, state, this.metadata('MEDIAN'),
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

  public rankAvg(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('RANK.AVG'),
      (value: number, range: SimpleRangeValue, order: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        const ties = vals.filter(v => v === value).length
        if (ties === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
        }
        // order 0 (or omitted) = descending: rank 1 is the largest. Non-zero = ascending. Tied values
        // share the average of the consecutive ranks they occupy.
        const better = order === 0 ? vals.filter(v => v > value).length : vals.filter(v => v < value).length
        return better + (ties + 1) / 2
      }
    )
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
