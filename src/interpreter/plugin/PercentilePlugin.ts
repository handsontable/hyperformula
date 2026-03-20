/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Computes the inclusive percentile (PERCENTILE / PERCENTILE.INC) using
 * the linear interpolation method: rank = k * (n - 1).
 */
function percentileInclusive(sortedVals: number[], k: number): number | CellError {
  if (sortedVals.length === 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
  }
  if (k < 0 || k > 1) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
  }
  const n = sortedVals.length
  const rank = k * (n - 1)
  const intPart = Math.floor(rank)
  const fraction = rank - intPart
  if (intPart + 1 < n) {
    return sortedVals[intPart] + fraction * (sortedVals[intPart + 1] - sortedVals[intPart])
  }
  return sortedVals[intPart]
}

/**
 * Computes the exclusive percentile (PERCENTILE.EXC) using
 * the linear interpolation method: rank = k * (n + 1).
 * k must be in the range (0, 1), and the resulting rank must be in [1, n].
 */
function percentileExclusive(sortedVals: number[], k: number): number | CellError {
  if (sortedVals.length === 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
  }
  if (k <= 0 || k >= 1) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
  }
  const n = sortedVals.length
  const rank = k * (n + 1)
  if (rank < 1 || rank > n) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
  }
  const intPart = Math.floor(rank)
  const fraction = rank - intPart
  if (intPart < n) {
    return sortedVals[intPart - 1] + fraction * (sortedVals[intPart] - sortedVals[intPart - 1])
  }
  return sortedVals[intPart - 1]
}

/**
 * Interpreter plugin containing PERCENTILE, PERCENTILE.INC, PERCENTILE.EXC,
 * QUARTILE, QUARTILE.INC, and QUARTILE.EXC functions.
 */
export class PercentilePlugin extends FunctionPlugin implements FunctionPluginTypecheck<PercentilePlugin> {

  public static implementedFunctions: ImplementedFunctions = {
    'PERCENTILE': {
      method: 'percentile',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0, maxValue: 1},
      ],
    },
    'PERCENTILE.INC': {
      method: 'percentile',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0, maxValue: 1},
      ],
    },
    'PERCENTILE.EXC': {
      method: 'percentileExc',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0, lessThan: 1},
      ],
    },
    'QUARTILE': {
      method: 'quartile',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0, maxValue: 4},
      ],
    },
    'QUARTILE.INC': {
      method: 'quartile',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0, maxValue: 4},
      ],
    },
    'QUARTILE.EXC': {
      method: 'quartileExc',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1, maxValue: 3},
      ],
    },
  }

  /**
   * Corresponds to PERCENTILE(array, k) and PERCENTILE.INC(array, k).
   *
   * Returns the k-th percentile of values in a range using inclusive interpolation.
   */
  public percentile(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PERCENTILE'),
      (range: SimpleRangeValue, k: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        if (vals.length === 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        vals.sort((a, b) => a - b)
        return percentileInclusive(vals, k)
      }
    )
  }

  /**
   * Corresponds to PERCENTILE.EXC(array, k).
   *
   * Returns the k-th percentile of values in a range using exclusive interpolation.
   */
  public percentileExc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PERCENTILE.EXC'),
      (range: SimpleRangeValue, k: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        if (vals.length === 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        vals.sort((a, b) => a - b)
        return percentileExclusive(vals, k)
      }
    )
  }

  /**
   * Corresponds to QUARTILE(array, quart) and QUARTILE.INC(array, quart).
   *
   * Returns the quartile of a data set using inclusive interpolation.
   * quart is truncated to an integer in [0, 4] and mapped to k = quart / 4.
   */
  public quartile(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('QUARTILE'),
      (range: SimpleRangeValue, quart: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        if (vals.length === 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        vals.sort((a, b) => a - b)
        quart = Math.trunc(quart)
        return percentileInclusive(vals, quart / 4)
      }
    )
  }

  /**
   * Corresponds to QUARTILE.EXC(array, quart).
   *
   * Returns the quartile of a data set using exclusive interpolation.
   * quart is truncated to an integer in [1, 3] and mapped to k = quart / 4.
   */
  public quartileExc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('QUARTILE.EXC'),
      (range: SimpleRangeValue, quart: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        if (vals.length === 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        vals.sort((a, b) => a - b)
        quart = Math.trunc(quart)
        return percentileExclusive(vals, quart / 4)
      }
    )
  }
}
