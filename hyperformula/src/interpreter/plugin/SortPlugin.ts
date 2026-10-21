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
import {FunctionArgumentType, FunctionMetadata, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

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
    'SORTBY': {
      method: 'sortby',
      sizeOfResultArrayMethod: 'sortbyArraySize',
      enableArrayArithmeticForArguments: true,
      // by_array and sort_order repeat as a pair
      repeatLastArgs: 2,
      parameters: [
        // array
        {argumentType: FunctionArgumentType.RANGE},
        // by_array1
        {argumentType: FunctionArgumentType.RANGE},
        // [sort_order1]
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true},
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
        const compare = (a: InternalNoErrorScalarValue, b: InternalNoErrorScalarValue): number =>
          this.compareSortKeys(a, b, sortOrder)

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
   * Corresponds to SORTBY(array, by_array1, [sort_order1], [by_array2, sort_order2], ...).
   *
   * Returns `array` with its rows reordered by the keys of the `by_array` arguments (or its columns, when the keys
   * are a row). Each `by_array` is a single column (or row) as long as `array` is tall (or wide); a single-cell
   * `by_array` is a constant key and reorders nothing. Later keys only break the ties of the earlier ones and the
   * sort is stable. `sort_order` is 1 or -1 after rounding down; any other value yields #VALUE!. Errors among the
   * keys are not propagated: they sort after every other value, in input order, like empty cells.
   *
   * @param {ProcedureAst} ast - the parsed function-call AST node.
   * @param {InterpreterState} state - current interpreter evaluation state.
   */
  public sortby(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SORTBY'),
      (array: SimpleRangeValue, ...criteria: (SimpleRangeValue | number)[]) => {
        if (!SortPlugin.isSortbyArgumentCountValid(ast.args.length)) {
          return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
        }

        const sortKeys = Array.from({length: criteria.length / 2}, (_, i) => ({
          byArray: criteria[2 * i] as SimpleRangeValue,
          sortOrder: Math.floor(criteria[2 * i + 1] as number),
        }))

        if (sortKeys.some(({sortOrder}) => sortOrder !== 1 && sortOrder !== -1)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
        }

        // Same guard as in SORT: an empty array has no rows to reorder and cannot be built into a range.
        if (array.data.length === 0 || array.data[0].length === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
        }

        const axes = sortKeys.map(({byArray}) => SortPlugin.sortAxis(array, byArray))
        const sortedAxes = axes.filter((axis) => axis !== 'none')

        if (axes.includes(undefined) || new Set(sortedAxes).size > 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.WrongDimension)
        }

        const sortsRows = sortedAxes[0] !== 'columns'
        const data = array.data
        const order = Array.from({length: sortsRows ? data.length : data[0].length}, (_, i) => i)
        const keyColumns = sortKeys
          .filter((_, i) => axes[i] !== 'none')
          .map(({byArray, sortOrder}) => ({
            keys: sortsRows ? byArray.data.map((row) => row[0]) : byArray.data[0],
            sortOrder,
          }))

        order.sort((i, j) => {
          const firstDifference = keyColumns
            .map(({keys, sortOrder}) => this.compareSortKeys(keys[i], keys[j], sortOrder))
            .find((difference) => difference !== 0)
          return firstDifference ?? 0
        })

        return SimpleRangeValue.onlyValues(sortsRows
          ? order.map((i) => data[i].slice())
          : data.map((row) => order.map((i) => row[i])))
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
    return this.sizeOfFirstArgument(ast, state, this.metadata('SORT'))
  }

  /**
   * Predicts the output array size for SORTBY at parse time.
   * The result is always the same shape as the input array.
   *
   * @param {ProcedureAst} ast - the parsed function-call AST node.
   * @param {InterpreterState} state - current interpreter evaluation state.
   */
  public sortbyArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || !SortPlugin.isSortbyArgumentCountValid(ast.args.length)) {
      return ArraySize.error()
    }
    return this.sizeOfFirstArgument(ast, state, this.metadata('SORTBY'))
  }

  /**
   * SORTBY takes `array` and `by_array1`, optionally followed by `sort_order1` and then by further pairs of
   * `by_array` and `sort_order`, so a `by_array` can't be the last argument once there are more than two.
   */
  private static isSortbyArgumentCountValid(argumentCount: number): boolean {
    return argumentCount <= 2 || argumentCount % 2 === 1
  }

  /**
   * Tells along which dimension the keys of `byArray` order `array`: its `rows` (a column of keys), its `columns`
   * (a row of keys), or `none` for a single cell; `undefined` if the keys don't fit `array`.
   */
  private static sortAxis(array: SimpleRangeValue, byArray: SimpleRangeValue): 'rows' | 'columns' | 'none' | undefined {
    if (byArray.width() === 1 && byArray.height() === 1) {
      return 'none'
    }
    if (byArray.width() === 1 && byArray.height() === array.height()) {
      return 'rows'
    }
    if (byArray.height() === 1 && byArray.width() === array.width()) {
      return 'columns'
    }
    return undefined
  }

  private sizeOfFirstArgument(ast: ProcedureAst, state: InterpreterState, metadata: FunctionMetadata): ArraySize {
    const subChecks = ast.args.map((arg) =>
      this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
    // Return a fresh ArraySize (isRef defaults to false). Propagating the input's
    // ArraySize verbatim would carry its `isRef` flag, and ArraySize.isScalar()
    // treats a ref as scalar — which would collapse the spilled result into a
    // single cell. The output always matches the input shape.
    return new ArraySize(subChecks[0].width, subChecks[0].height)
  }

  /**
   * Compares two sort keys for the given `sortOrder` (1 ascending, -1 descending). Empty cells and errors are
   * kept at the end regardless of `sortOrder` (errors before empty cells), rather than coercing them to 0 and
   * ordering by value, as Excel does; the rest is delegated to {@link ArithmeticHelper}.
   */
  private compareSortKeys(a: InternalScalarValue, b: InternalScalarValue, sortOrder: number): number {
    const aRank = SortPlugin.trailingRank(a)
    const bRank = SortPlugin.trailingRank(b)
    if (aRank !== bRank) {
      return aRank - bRank
    }
    if (aRank !== 0) {
      return 0
    }
    if (this.arithmeticHelper.lt(a as InternalNoErrorScalarValue, b as InternalNoErrorScalarValue)) {
      return -sortOrder
    }
    if (this.arithmeticHelper.gt(a as InternalNoErrorScalarValue, b as InternalNoErrorScalarValue)) {
      return sortOrder
    }
    return 0
  }

  /** 0 for a value that is sorted by its value, 1 for an error and 2 for an empty cell: those come last. */
  private static trailingRank(value: InternalScalarValue): number {
    if (value === EmptyValue) {
      return 2
    }
    return value instanceof CellError ? 1 : 0
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
