/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InternalNoErrorScalarValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Plugin implementing the SORT spreadsheet function.
 *
 * SORT(array, [sort_index], [sort_order], [by_col]) returns the elements of
 * `array` sorted along one dimension. The returned array has the same shape as
 * the input. By default it reorders rows using the first column as the key,
 * ascending. Ordering is delegated to {@link ArithmeticHelper} so that mixed
 * types, empty cells, and locale collation behave exactly as elsewhere in the
 * engine.
 */
export class SortPlugin extends FunctionPlugin implements FunctionPluginTypecheck<SortPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'SORT': {
      method: 'sort',
      sizeOfResultArrayMethod: 'sortArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false, emptyAsDefault: true},
      ],
      vectorizationForbidden: true,
    },
  }

  /**
   * Corresponds to SORT(array, [sort_index], [sort_order], [by_col]).
   *
   * `sort_order` is validated strictly to {1, -1} (the documented contract);
   * any other value yields #VALUE!. `sort_index` is a 1-based index into the sort
   * dimension (columns when sorting rows, rows when `by_col` is TRUE). Errors found
   * anywhere in the input range are propagated.
   *
   * @param {ProcedureAst} ast - the parsed function-call AST node.
   * @param {InterpreterState} state - current interpreter evaluation state.
   */
  public sort(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SORT'),
      (range: SimpleRangeValue, sortIndex: number, sortOrder: number, byCol: boolean) => {
        if (sortOrder !== 1 && sortOrder !== -1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
        }

        const data = range.data
        const height = range.height()
        const width = range.width()

        const firstError = SortPlugin.findFirstError(data)
        if (firstError !== undefined) {
          return firstError
        }

        // An empty input range (e.g. a whole-column reference to an empty sheet)
        // yields no rows/columns to sort. Return #N/A rather than letting the empty
        // 2-D array reach SimpleRangeValue.onlyValues, which reads data[0].length and
        // would throw. Mirrors UNIQUE/FILTER's empty-range handling.
        if (data.length === 0 || data[0].length === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
        }

        const index = Math.trunc(sortIndex)
        const sortDimension = byCol ? height : width
        if (index < 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
        }
        if (index > sortDimension) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }

        const keyIndex = index - 1
        const compare = (a: InternalNoErrorScalarValue, b: InternalNoErrorScalarValue): number => {
          // Excel keeps empty cells at the end of the result regardless of
          // sort_order, rather than coercing them to 0 and ordering by value.
          // Force empties last (direction-independent) before delegating the
          // rest to ArithmeticHelper.
          const aEmpty = a === EmptyValue
          const bEmpty = b === EmptyValue
          if (aEmpty || bEmpty) {
            if (aEmpty && bEmpty) {
              return 0
            }
            return aEmpty ? 1 : -1
          }
          if (this.arithmeticHelper.lt(a, b)) {
            return -sortOrder
          }
          if (this.arithmeticHelper.gt(a, b)) {
            return sortOrder
          }
          return 0
        }

        if (byCol) {
          // Reorder columns; the key of column c is data[keyIndex][c].
          const order = Array.from({length: width}, (_, c) => c)
          order.sort((c1, c2) => compare(
            data[keyIndex][c1] as InternalNoErrorScalarValue,
            data[keyIndex][c2] as InternalNoErrorScalarValue,
          ))
          const result: InternalScalarValue[][] = data.map(row => order.map(c => row[c]))
          return SimpleRangeValue.onlyValues(result)
        }

        // Reorder rows; the key of row r is data[r][keyIndex].
        const rows: InternalScalarValue[][] = data.map(row => row.slice())
        rows.sort((r1, r2) => compare(
          r1[keyIndex] as InternalNoErrorScalarValue,
          r2[keyIndex] as InternalNoErrorScalarValue,
        ))
        return SimpleRangeValue.onlyValues(rows)
      }
    )
  }

  /**
   * Predicts the output array size for SORT at parse time.
   * The result is always the same shape as the input array.
   *
   * @param {ProcedureAst} ast - the parsed function-call AST node.
   * @param {InterpreterState} state - current interpreter evaluation state.
   */
  public sortArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 4) {
      return ArraySize.error()
    }
    const metadata = this.metadata('SORT')
    const subChecks = ast.args.map((arg) =>
      this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
    // Return a fresh ArraySize (isRef defaults to false). Propagating the input's
    // ArraySize verbatim would carry its `isRef` flag, and ArraySize.isScalar()
    // treats a ref as scalar — which would collapse the spilled result into a
    // single cell. SORT's output always matches the input shape.
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
}
