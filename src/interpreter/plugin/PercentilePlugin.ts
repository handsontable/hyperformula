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
 * Computes the inclusive percentile using linear interpolation: rank = k * (n - 1).
 * Assumes sortedVals is non-empty and k is in [0, 1].
 */
function percentileInclusive(sortedVals: number[], k: number): number {
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
 * Computes the exclusive percentile using linear interpolation: rank = k * (n + 1).
 * Assumes sortedVals is non-empty and k is in (0, 1).
 * Returns CellError if the resulting rank falls outside [1, n].
 */
function percentileExclusive(sortedVals: number[], k: number): number | CellError {
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
        {argumentType: FunctionArgumentType.NUMBER},
      ],
    },
    'QUARTILE.INC': {
      method: 'quartile',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
    },
    'QUARTILE.EXC': {
      method: 'quartileExc',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
    },
  }

  /**
   * Corresponds to PERCENTILE(array, k) and PERCENTILE.INC(array, k).
   *
   * Returns the k-th percentile of values in a range using inclusive interpolation.
   */
  public percentile(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(ast.procedureName),
      (range: SimpleRangeValue, k: number) => {
        const vals = this.getSortedValues(range)
        if (vals instanceof CellError) {
          return vals
        }
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
        const vals = this.getSortedValues(range)
        if (vals instanceof CellError) {
          return vals
        }
        return percentileExclusive(vals, k)
      }
    )
  }

  /**
   * Corresponds to QUARTILE(array, quart) and QUARTILE.INC(array, quart).
   *
   * Returns the quartile of a data set using inclusive interpolation.
   * quart is truncated to an integer and validated in [0, 4].
   */
  public quartile(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(ast.procedureName),
      (range: SimpleRangeValue, quart: number) => {
        quart = Math.trunc(quart)
        if (quart < 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        if (quart > 4) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        const vals = this.getSortedValues(range)
        if (vals instanceof CellError) {
          return vals
        }
        return percentileInclusive(vals, quart / 4)
      }
    )
  }

  /**
   * Corresponds to QUARTILE.EXC(array, quart).
   *
   * Returns the quartile of a data set using exclusive interpolation.
   * quart is truncated to an integer and validated in [1, 3].
   */
  public quartileExc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('QUARTILE.EXC'),
      (range: SimpleRangeValue, quart: number) => {
        quart = Math.trunc(quart)
        if (quart < 1) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        if (quart > 3) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        const vals = this.getSortedValues(range)
        if (vals instanceof CellError) {
          return vals
        }
        return percentileExclusive(vals, quart / 4)
      }
    )
  }

  /**
   * Extracts numeric values from a range, filters non-numbers, and returns them sorted.
   * Returns CellError if the range contains an error, or if no numeric values exist.
   */
  private getSortedValues(range: SimpleRangeValue): number[] | CellError {
    const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
    if (vals instanceof CellError) {
      return vals
    }
    if (vals.length === 0) {
      return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
    }
    vals.sort((a, b) => a - b)
    return vals
  }
}
