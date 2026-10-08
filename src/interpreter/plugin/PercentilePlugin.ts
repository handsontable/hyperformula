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
 *
 * @param sortedVals - pre-sorted array of numeric values (ascending)
 * @param k - percentile fraction in [0, 1]
 * @returns interpolated percentile value
 */
function percentileInclusive(sortedVals: number[], k: number): number {
  const n = sortedVals.length
  const rank = k * (n - 1)
  const lowerIndex = Math.floor(rank)
  const fraction = rank - lowerIndex
  if (lowerIndex + 1 < n) {
    return sortedVals[lowerIndex] + fraction * (sortedVals[lowerIndex + 1] - sortedVals[lowerIndex])
  }
  return sortedVals[lowerIndex]
}

/**
 * Computes the exclusive percentile using linear interpolation: rank = k * (n + 1).
 * Assumes sortedVals is non-empty and k is in (0, 1).
 * Returns CellError if the resulting rank falls outside [1, n].
 *
 * @param sortedVals - pre-sorted array of numeric values (ascending)
 * @param k - percentile fraction in (0, 1)
 * @returns interpolated percentile value, or CellError if rank is out of bounds
 */
function percentileExclusive(sortedVals: number[], k: number): number | CellError {
  const n = sortedVals.length
  const rank = k * (n + 1)
  // Exclusive method requires rank in [1, n]; values outside mean k is too extreme for this dataset size
  if (rank < 1) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
  }
  if (rank > n) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
  }
  const lowerIndex = Math.floor(rank)
  const fraction = rank - lowerIndex
  if (lowerIndex < n) {
    return sortedVals[lowerIndex - 1] + fraction * (sortedVals[lowerIndex] - sortedVals[lowerIndex - 1])
  }
  return sortedVals[lowerIndex - 1]
}

/**
 * Interpreter plugin for percentile and quartile statistical functions.
 *
 * Implements inclusive (INC) and exclusive (EXC) interpolation variants.
 * QUARTILE functions delegate to PERCENTILE by converting quart index to
 * a percentile fraction (quart / 4) after truncating to integer.
 */
export class PercentilePlugin extends FunctionPlugin implements FunctionPluginTypecheck<PercentilePlugin> {

  public static implementedFunctions: ImplementedFunctions = {
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
    'PERCENTRANK.EXC': {
      method: 'percentrankExc',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1, defaultValue: 3},
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

  public static aliases = {
    PERCENTILE: 'PERCENTILE.INC',
    QUARTILE: 'QUARTILE.INC',
  }

  /**
   * Corresponds to PERCENTILE(array, k) and PERCENTILE.INC(array, k).
   *
   * Returns the k-th percentile of values in a range using inclusive interpolation.
   *
   * @param ast - procedure AST node
   * @param state - interpreter state
   * @returns interpolated percentile value, or CellError on invalid input
   */
  public percentile(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PERCENTILE.INC'),
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
   *
   * @param ast - procedure AST node
   * @param state - interpreter state
   * @returns interpolated percentile value, or CellError on invalid input
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
   * Corresponds to PERCENTRANK.EXC(array, x, [significance]).
   *
   * Returns the exclusive rank of x in the array, i.e. the inverse of PERCENTILE.EXC, truncated (not rounded)
   * to the given number of significant digits. Values between two array elements are linearly interpolated.
   *
   * @param ast - procedure AST node
   * @param state - interpreter state
   * @returns rank in (0, 1), #N/A if x is outside of the array, or CellError on invalid input
   */
  public percentrankExc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PERCENTRANK.EXC'),
      (range: SimpleRangeValue, x: number, significance: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        vals.sort((a, b) => a - b)
        const n = vals.length
        if (n === 0 || x < vals[0] || x > vals[n - 1]) {
          return new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
        }
        if (n === 1) {
          return 1
        }
        const upperIndex = vals.findIndex(val => val >= x)
        const rank = vals[upperIndex] === x
          ? upperIndex + 1
          : upperIndex + (x - vals[upperIndex - 1]) / (vals[upperIndex] - vals[upperIndex - 1])
        const scale = Math.pow(10, Math.trunc(significance))
        return Math.floor(rank / (n + 1) * scale + 1e-9) / scale
      }
    )
  }

  /**
   * Corresponds to QUARTILE(array, quart) and QUARTILE.INC(array, quart).
   *
   * Returns the quartile of a data set using inclusive interpolation.
   * quart is truncated to an integer and validated in [0, 4].
   *
   * @param ast - procedure AST node
   * @param state - interpreter state
   * @returns quartile value, or CellError on invalid input
   */
  public quartile(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('QUARTILE.INC'),
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
        // Convert quartile index to percentile fraction: 0→0%, 1→25%, 2→50%, 3→75%, 4→100%
        return percentileInclusive(vals, quart / 4)
      }
    )
  }

  /**
   * Corresponds to QUARTILE.EXC(array, quart).
   *
   * Returns the quartile of a data set using exclusive interpolation.
   * quart is truncated to an integer and validated in [1, 3].
   *
   * @param ast - procedure AST node
   * @param state - interpreter state
   * @returns quartile value, or CellError on invalid input
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
        // Convert quartile index to percentile fraction: 1→25%, 2→50%, 3→75%
        return percentileExclusive(vals, quart / 4)
      }
    )
  }

  /**
   * Extracts numeric values from a range, filters non-numbers, and returns them sorted.
   * Returns CellError if the range contains an error, or if no numeric values exist.
   *
   * @param range - input range from the spreadsheet
   * @returns sorted numeric values (ascending), or CellError
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
