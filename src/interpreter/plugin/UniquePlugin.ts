/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalNoErrorScalarValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Plugin implementing the UNIQUE spreadsheet function.
 *
 * UNIQUE(array, [by_col], [exactly_once]) returns the distinct rows (or columns
 * when by_col is TRUE) of `array`, preserving first-occurrence order. When
 * exactly_once is TRUE, only rows/columns that occur exactly once are returned.
 * Equality delegates to {@link ArithmeticHelper}, so comparison honors the
 * caseSensitive/accentSensitive configuration (case-insensitive by default).
 */
export class UniquePlugin extends FunctionPlugin implements FunctionPluginTypecheck<UniquePlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'UNIQUE': {
      method: 'unique',
      sizeOfResultArrayMethod: 'uniqueArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false, emptyAsDefault: true},
      ],
      vectorizationForbidden: true,
    },
  }

  /**
   * Corresponds to UNIQUE(array, [by_col], [exactly_once]).
   *
   * Errors found anywhere in the input range are propagated. An empty result
   * (only reachable via exactly_once when nothing occurs exactly once) yields
   * #N/A, mirroring FILTER's empty-result handling.
   *
   * @param {ProcedureAst} ast - the parsed function-call AST node.
   * @param {InterpreterState} state - current interpreter evaluation state.
   */
  public unique(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('UNIQUE'),
      (range: SimpleRangeValue, byCol: boolean, exactlyOnce: boolean) => {
        const data = range.data

        const firstError = UniquePlugin.findFirstError(data)
        if (firstError !== undefined) {
          return firstError
        }

        // Work in "vectors": rows for the default, columns when by_col is TRUE.
        const vectors: InternalScalarValue[][] = byCol
          ? UniquePlugin.transpose(data)
          : data.map(row => row.slice())

        const equalVectors = (v1: InternalScalarValue[], v2: InternalScalarValue[]): boolean => {
          // v1 and v2 are always the same length here: they are rows (or columns,
          // after transpose) of the same rectangular range, so no length check is
          // needed before the element-wise comparison.
          for (let i = 0; i < v1.length; i++) {
            if (!this.arithmeticHelper.eq(v1[i] as InternalNoErrorScalarValue, v2[i] as InternalNoErrorScalarValue)) {
              return false
            }
          }
          return true
        }

        // Preserve first-occurrence order; count occurrences for exactly_once.
        // Deduplication is O(n^2) in the number of vectors: equality is locale-aware
        // (via arithmeticHelper.eq) and not trivially hashable, so each vector is
        // compared against the distinct ones found so far. This matches Excel's
        // observable behavior; for very large inputs it is the known cost.
        const distinct: InternalScalarValue[][] = []
        const counts: number[] = []
        for (const vector of vectors) {
          const existing = distinct.findIndex(d => equalVectors(d, vector))
          if (existing === -1) {
            distinct.push(vector)
            counts.push(1)
          } else {
            counts[existing] += 1
          }
        }

        const kept = exactlyOnce
          ? distinct.filter((_, i) => counts[i] === 1)
          : distinct

        if (kept.length === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
        }

        const result = byCol ? UniquePlugin.transpose(kept) : kept
        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /**
   * Predicts the output array size for UNIQUE at parse time.
   * The size is data-dependent, so we predict the input size as an upper bound
   * (mirroring FILTER) and return the smaller actual result at runtime. A fresh
   * ArraySize is returned so the input's `isRef` flag is not propagated (an
   * ArraySize flagged as a ref is treated as scalar, which would collapse the
   * spilled result into a single cell).
   *
   * @param {ProcedureAst} ast - the parsed function-call AST node.
   * @param {InterpreterState} state - current interpreter evaluation state.
   */
  public uniqueArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 3) {
      return ArraySize.error()
    }
    const metadata = this.metadata('UNIQUE')
    const subChecks = ast.args.map((arg) =>
      this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
    return new ArraySize(subChecks[0].width, subChecks[0].height)
  }

  /** Returns the first {@link CellError} found in a 2-D array, or undefined. */
  private static findFirstError(data: InternalScalarValue[][]): CellError | undefined {
    for (const row of data) {
      for (const cell of row) {
        if (cell instanceof CellError) {
          return cell
        }
      }
    }
    return undefined
  }

  /** Transposes a 2-D array (rows <-> columns). */
  private static transpose(data: InternalScalarValue[][]): InternalScalarValue[][] {
    if (data.length === 0) {
      return []
    }
    const height = data.length
    const width = data[0].length
    const result: InternalScalarValue[][] = []
    for (let c = 0; c < width; c++) {
      const col: InternalScalarValue[] = []
      for (let r = 0; r < height; r++) {
        col.push(data[r][c])
      }
      result.push(col)
    }
    return result
  }
}
