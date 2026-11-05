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

/** Rank of each error type among sort keys: Excel's `ERROR.TYPE` number, then the errors only HyperFormula has. */
const SORT_ERROR_RANK: Record<ErrorType, number> = {
  [ErrorType.DIV_BY_ZERO]: 2,
  [ErrorType.VALUE]: 3,
  [ErrorType.REF]: 4,
  [ErrorType.NAME]: 5,
  [ErrorType.NUM]: 6,
  [ErrorType.NA]: 7,
  [ErrorType.SPILL]: 9,
  [ErrorType.CYCLE]: 10,
  [ErrorType.LIC]: 11,
  [ErrorType.ERROR]: 12,
}

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
   * keys are not propagated: they sort after every value in ascending order and before every value in descending
   * order, ordered among themselves by their `ERROR.TYPE` number. Empty keys stay last in both orders.
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
   * (a row of keys), or `none` for a single cell; `undefined` if the keys don't fit `array`. A cell range is
   * measured by its own shape, so a whole column fits only another whole column.
   */
  private static sortAxis(array: SimpleRangeValue, byArray: SimpleRangeValue): 'rows' | 'columns' | 'none' | undefined {
    const [arrayWidth, arrayHeight] = SortPlugin.shapeOf(array)
    const [keysWidth, keysHeight] = SortPlugin.shapeOf(byArray)
    if (keysWidth === 1 && keysHeight === 1) {
      return 'none'
    }
    if (keysWidth === 1 && keysHeight === arrayHeight) {
      return 'rows'
    }
    if (keysHeight === 1 && keysWidth === arrayWidth) {
      return 'columns'
    }
    return undefined
  }

  /** Width and height of a range value: a cell range's own (infinite for a whole column or row), else the data's. */
  private static shapeOf(rangeValue: SimpleRangeValue): [number, number] {
    const range = rangeValue.range
    return range === undefined ? [rangeValue.width(), rangeValue.height()] : [range.width(), range.height()]
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
   * Compares two sort keys for the given `sortOrder` (1 ascending, -1 descending). In ascending order numbers come
   * first, then text, then logical values (as {@link ArithmeticHelper} orders them), then errors, ordered among
   * themselves by their `ERROR.TYPE` number; `sortOrder` -1 reverses all of that. Empty cells stay at the end in both
   * orders, rather than being coerced to 0. Keys that compare equal keep their input order.
   */
  private compareSortKeys(a: InternalScalarValue, b: InternalScalarValue, sortOrder: number): number {
    if (a === EmptyValue || b === EmptyValue) {
      return (a === EmptyValue ? 1 : 0) - (b === EmptyValue ? 1 : 0)
    }
    return sortOrder * this.compareNonEmptyKeys(a, b)
  }

  /** Ascending comparison of two non-empty sort keys: values before errors, errors by their `ERROR.TYPE` number. */
  private compareNonEmptyKeys(a: InternalScalarValue, b: InternalScalarValue): number {
    if (a instanceof CellError || b instanceof CellError) {
      return SortPlugin.errorRank(a) - SortPlugin.errorRank(b)
    }
    if (this.arithmeticHelper.lt(a, b)) {
      return -1
    }
    if (this.arithmeticHelper.gt(a, b)) {
      return 1
    }
    return 0
  }

  /**
   * 0 for a value; for an error, its `ERROR.TYPE` number (#DIV/0! 2, #VALUE! 3, #REF! 4, #NAME? 5, #NUM! 6, #N/A 7,
   * #SPILL! 9), and for the errors that only HyperFormula has, numbers after those.
   */
  private static errorRank(value: InternalScalarValue): number {
    return value instanceof CellError ? SORT_ERROR_RANK[value.type] : 0
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
