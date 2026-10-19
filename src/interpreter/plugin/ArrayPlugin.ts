/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {BooleanPlugin} from './BooleanPlugin'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Classifies a TAKE or DROP count, a WRAPROWS or WRAPCOLS `wrap_count`, or an
 * EXPAND `rows` or `columns` expression whose value may be known before evaluation.
 *
 * @internal
 */
type LiteralCount =
  | {kind: 'value', value: number}
  | {kind: 'invalid'}
  | {kind: 'unresolved'}

/**
 * Distinguishes an omitted or empty TAKE count from an expression whose value
 * cannot be resolved during static result-size prediction.
 *
 * @internal
 */
type TakeLiteralDimension = LiteralCount | {kind: 'unbounded'}

/**
 * Distinguishes an omitted or empty EXPAND `rows` or `columns`, which keeps the
 * source dimension, from an expression whose value cannot be resolved during
 * static result-size prediction.
 *
 * @internal
 */
type ExpandLiteralDimension = LiteralCount | {kind: 'kept'}

/**
 * The functions that share the WRAPROWS and WRAPCOLS implementation.
 *
 * @internal
 */
type WrapFunctionName = 'WRAPROWS' | 'WRAPCOLS'

/**
 * The largest number of rows EXPAND returns: the height of a Microsoft Excel
 * sheet. EXPAND has no limit on the number of columns.
 */
const EXPAND_MAX_ROWS = 1048576

export class ArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayPlugin> {
  /**
   * Evaluates the dependency-free subset of TAKE and DROP count expressions,
   * of WRAPROWS and WRAPCOLS `wrap_count` expressions, and of EXPAND `rows`
   * and `columns` expressions, used for static result-size prediction.
   *
   * @param {Ast | undefined} argument - The count expression to inspect before evaluation.
   * @returns {LiteralCount} The constant value, an invalid-literal marker, or an unresolved marker.
   * @internal
   */
  private parseLiteralCount(argument: Ast | undefined): LiteralCount {
    if (argument?.type === AstNodeType.NUMBER) {
      return {kind: 'value', value: argument.value}
    }

    if (argument?.type === AstNodeType.STRING) {
      const coercedValue = this.arithmeticHelper.coerceToMaybeNumber(argument.value)
      if (coercedValue === undefined) {
        return {kind: 'invalid'}
      }
      return {kind: 'value', value: getRawValue(coercedValue)}
    }

    if (argument?.type === AstNodeType.ERROR || argument?.type === AstNodeType.ERROR_WITH_RAW_INPUT) {
      return {kind: 'invalid'}
    }

    if (argument?.type === AstNodeType.PLUS_UNARY_OP || argument?.type === AstNodeType.MINUS_UNARY_OP) {
      const dimension = this.parseLiteralCount(argument.value)
      if (dimension.kind !== 'value') {
        return dimension
      }
      return {kind: 'value', value: argument.type === AstNodeType.MINUS_UNARY_OP ? -dimension.value : dimension.value}
    }

    if (argument?.type === AstNodeType.PARENTHESIS) {
      return this.parseLiteralCount(argument.expression)
    }

    if (argument?.type === AstNodeType.PERCENT_OP) {
      const dimension = this.parseLiteralCount(argument.value)
      if (dimension.kind !== 'value') {
        return dimension
      }
      return {kind: 'value', value: getRawValue(this.arithmeticHelper.unaryPercent(dimension.value))}
    }

    if (
      argument?.type === AstNodeType.FUNCTION_CALL
      && argument.args.length === 0
      && (argument.procedureName === 'TRUE' || argument.procedureName === 'FALSE')
      && this.interpreter.isFunctionImplementedBy(argument.procedureName, BooleanPlugin)
    ) {
      return {kind: 'value', value: argument.procedureName === 'TRUE' ? 1 : 0}
    }

    if (
      argument?.type === AstNodeType.PLUS_OP
      || argument?.type === AstNodeType.MINUS_OP
      || argument?.type === AstNodeType.TIMES_OP
      || argument?.type === AstNodeType.DIV_OP
      || argument?.type === AstNodeType.POWER_OP
    ) {
      const left = this.parseLiteralCount(argument.left)
      const right = this.parseLiteralCount(argument.right)
      if (left.kind === 'invalid' || right.kind === 'invalid') {
        return {kind: 'invalid'}
      }
      if (left.kind === 'value' && right.kind === 'value') {
        let value: number
        switch (argument.type) {
          case AstNodeType.PLUS_OP:
            value = this.arithmeticHelper.addWithEpsilonRaw(left.value, right.value)
            break
          case AstNodeType.MINUS_OP:
            value = getRawValue(this.arithmeticHelper.subtract(left.value, right.value))
            break
          case AstNodeType.TIMES_OP:
            value = getRawValue(this.arithmeticHelper.multiply(left.value, right.value))
            break
          case AstNodeType.DIV_OP: {
            const quotient = this.arithmeticHelper.divide(left.value, right.value)
            if (quotient instanceof CellError) {
              return {kind: 'invalid'}
            }
            value = getRawValue(quotient)
            break
          }
          case AstNodeType.POWER_OP:
            value = this.arithmeticHelper.pow(left.value, right.value)
            break
        }
        return Number.isFinite(value) ? {kind: 'value', value} : {kind: 'invalid'}
      }
    }

    return {kind: 'unresolved'}
  }

  /**
   * Converts a statically resolved TAKE count into its output dimension.
   *
   * @param {Ast | undefined} argument - The count expression to classify.
   * @returns {TakeLiteralDimension} The non-negative truncated dimension or its invalid, unresolved, or unbounded classification.
   * @internal
   */
  private parseTakeLiteralDimension(argument: Ast | undefined): TakeLiteralDimension {
    if (argument === undefined || argument.type === AstNodeType.EMPTY) {
      return {kind: 'unbounded'}
    }

    const dimension = this.parseLiteralCount(argument)
    return dimension.kind === 'value'
      ? {kind: 'value', value: Math.abs(Math.trunc(dimension.value))}
      : dimension
  }

  /**
   * Resolves a direct TAKE or DROP source reference without evaluating its values.
   * The range supplies materialized dimensions only; spill placement never
   * depends on its sheet.
   *
   * @param {Ast} argument - The source expression to inspect.
   * @param {InterpreterState} state - The formula state used to resolve relative addresses.
   * @returns {AbsoluteCellRange | undefined} The source range, or `undefined` for a computed array.
   * @internal
   */
  private directSourceRange(argument: Ast, state: InterpreterState): AbsoluteCellRange | undefined {
    if (argument.type === AstNodeType.PARENTHESIS) {
      return this.directSourceRange(argument.expression, state)
    }
    if (argument.type === AstNodeType.CELL_RANGE || argument.type === AstNodeType.COLUMN_RANGE || argument.type === AstNodeType.ROW_RANGE) {
      return AbsoluteCellRange.fromAstOrUndef(argument, state.formulaAddress)
    }
    return undefined
  }

  /**
   * Classifies a DROP count before evaluation. An omitted or empty count
   * drops nothing, so it resolves to zero.
   *
   * @param {Ast | undefined} argument - The count expression to classify.
   * @returns {LiteralCount} The constant count, an invalid-literal marker, or an unresolved marker.
   * @internal
   */
  private parseDropLiteralCount(argument: Ast | undefined): LiteralCount {
    if (argument === undefined || argument.type === AstNodeType.EMPTY) {
      return {kind: 'value', value: 0}
    }
    return this.parseLiteralCount(argument)
  }

  /**
   * Predicts how many rows or columns of the source remain after DROP.
   *
   * An unresolved count may drop nothing, so the source dimension is the upper
   * bound. An unbounded source (a whole column or row) is measured by its
   * effective size. In a spreadsheet such a result reaches the sheet edge, so
   * it fits only when the formula starts no further from the first row or
   * column than the number of rows or columns dropped; otherwise the dimension
   * stays unbounded, which makes array-space validation report a spill error.
   * An unresolved count drops nothing for this rule too, so its result fits
   * only in the first row or column.
   *
   * @param {number} sourceDimension - The predicted source height or width, possibly unbounded.
   * @param {LiteralCount} count - The classified count; must not be invalid.
   * @param {number} anchor - The formula's row or column index along the same axis.
   * @param {number} effectiveDimension - The effective source height or width along the same axis.
   * @returns {number} The remaining dimension, zero when everything is dropped, or `Infinity` for a spill.
   * @internal
   */
  private predictDropDimension(sourceDimension: number, count: LiteralCount, anchor: number, effectiveDimension: number): number {
    const requestedDrop = count.kind === 'value' ? Math.abs(Math.trunc(count.value)) : 0

    if (!Number.isFinite(sourceDimension) && anchor > requestedDrop) {
      return Number.POSITIVE_INFINITY
    }

    const boundedDimension = Number.isFinite(sourceDimension) ? sourceDimension : effectiveDimension
    return boundedDimension - Math.min(requestedDrop, boundedDimension)
  }

  /**
   * Measures a TAKE or DROP source whose predicted size is unbounded. A direct
   * whole-column or whole-row reference is measured by its effective size; a
   * computed array falls back to the configured sheet limits.
   *
   * @param {Ast} argument - The source expression to measure.
   * @param {InterpreterState} state - The formula state used to resolve relative addresses.
   * @returns {ArraySize} The effective source size.
   * @internal
   */
  private effectiveSourceSize(argument: Ast, state: InterpreterState): ArraySize {
    const sourceRange = this.directSourceRange(argument, state)
    return new ArraySize(
      sourceRange?.effectiveWidth(this.dependencyGraph) ?? this.config.maxColumns,
      sourceRange?.effectiveHeight(this.dependencyGraph) ?? this.config.maxRows,
    )
  }

  /**
   * Returns a block of a source array as values. An address-backed source is
   * read only inside the block, so the cost is proportional to the result
   * rather than to the source. The block is returned as values rather than as
   * a range so that it coerces to a scalar like any other array result.
   *
   * @param {SimpleRangeValue} source - The evaluated source array.
   * @param {number} startRow - The first row of the block, relative to the source.
   * @param {number} startColumn - The first column of the block, relative to the source.
   * @param {number} height - The number of rows in the block.
   * @param {number} width - The number of columns in the block.
   * @returns {SimpleRangeValue} The block's values.
   * @internal
   */
  private sliceSourceArray(source: SimpleRangeValue, startRow: number, startColumn: number, height: number, width: number): SimpleRangeValue {
    const sourceRange = source.range

    if (sourceRange !== undefined) {
      const blockRange = AbsoluteCellRange.spanFrom(sourceRange.getAddress(startColumn, startRow), width, height)
      return SimpleRangeValue.onlyValues(SimpleRangeValue.onlyRange(blockRange, this.dependencyGraph).data)
    }

    const block = source.data
      .slice(startRow, startRow + height)
      .map(row => row.slice(startColumn, startColumn + width))

    return SimpleRangeValue.onlyValues(block)
  }

  public static implementedFunctions: ImplementedFunctions = {
    'ARRAYFORMULA': {
      method: 'arrayformula',
      sizeOfResultArrayMethod: 'arrayformulaArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
    },
    'ARRAY_CONSTRAIN': {
      method: 'arrayconstrain',
      sizeOfResultArrayMethod: 'arrayconstrainArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
      ],
      vectorizationForbidden: true,
    },
    'FILTER': {
      method: 'filter',
      sizeOfResultArrayMethod: 'filterArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
      ],
      repeatLastArgs: 1,
    },
    'DROP': {
      method: 'drop',
      sizeOfResultArrayMethod: 'dropArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: 0},
      ],
      vectorizationForbidden: true,
    },
    'TAKE': {
      method: 'take',
      sizeOfResultArrayMethod: 'takeArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: Number.POSITIVE_INFINITY, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, optionalArg: true, defaultValue: Number.POSITIVE_INFINITY, emptyAsDefault: true},
      ],
      vectorizationForbidden: true,
    },
    'WRAPROWS': {
      method: 'wraprows',
      sizeOfResultArrayMethod: 'wraprowsArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        // SCALAR: the count's error and coercion are checked in the method, after the vector's error and before its shape.
        {argumentType: FunctionArgumentType.SCALAR},
        // Any value pads as it is, errors included; omitted or empty pads with #N/A.
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
    'WRAPCOLS': {
      method: 'wrapcols',
      sizeOfResultArrayMethod: 'wrapcolsArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
    'EXPAND': {
      method: 'expand',
      sizeOfResultArrayMethod: 'expandArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        // Required, but an empty `rows` keeps the source height; coerced in the method, as `columns`.
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
        // Omitted pads with #N/A; empty pads with blank cells.
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
    'VSTACK': {
      method: 'vstack',
      sizeOfResultArrayMethod: 'vstackArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      repeatLastArgs: 1,
    },
    'HSTACK': {
      method: 'hstack',
      sizeOfResultArrayMethod: 'hstackArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      repeatLastArgs: 1,
    },
  }

  public arrayformula(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYFORMULA'), (value) => value)
  }

  public arrayformulaArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 1) {
      return ArraySize.error()
    }

    const metadata = this.metadata('ARRAYFORMULA')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    return subChecks[0]
  }

  public arrayconstrain(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAY_CONSTRAIN'), (range: SimpleRangeValue, numRows: number, numCols: number) => {
      numRows = Math.min(numRows, range.height())
      numCols = Math.min(numCols, range.width())
      const data: InternalScalarValue[][] = range.data
      const ret: InternalScalarValue[][] = []
      for (let i = 0; i < numRows; i++) {
        ret.push(data[i].slice(0, numCols))
      }
      return SimpleRangeValue.onlyValues(ret)
    })
  }

  public arrayconstrainArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 3) {
      return ArraySize.error()
    }

    const metadata = this.metadata('ARRAY_CONSTRAIN')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    let {height, width} = subChecks[0]
    if (ast.args[1].type === AstNodeType.NUMBER) {
      height = Math.min(height, ast.args[1].value)
    }
    if (ast.args[2].type === AstNodeType.NUMBER) {
      width = Math.min(width, ast.args[2].value)
    }
    if (height < 1 || width < 1 || !Number.isInteger(height) || !Number.isInteger(width)) {
      return ArraySize.error()
    }
    return new ArraySize(width, height)
  }

  public filter(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FILTER'), (rangeVals: SimpleRangeValue, ...rangeFilters: SimpleRangeValue[]) => {
      for (const filter of rangeFilters) {
        if (rangeVals.width() !== filter.width() || rangeVals.height() !== filter.height()) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
      }

      if (rangeVals.width() > 1 && rangeVals.height() > 1) {
        return new CellError(ErrorType.NA, ErrorMessage.WrongDimension)
      }

      const vals = rangeVals.data
      const ret = []
      for (let i = 0; i < rangeVals.height(); i++) {
        const row = []
        for (let j = 0; j < rangeVals.width(); j++) {
          let ok = true
          for (const filter of rangeFilters) {
            const val = coerceScalarToBoolean(filter.data[i][j])
            if (val !== true) {
              ok = false
              break
            }
          }
          if (ok) {
            row.push(vals[i][j])
          }
        }
        if (row.length > 0) {
          ret.push(row)
        }
      }
      if (ret.length > 0) {
        return SimpleRangeValue.onlyValues(ret)
      } else {
        return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
      }
    })
  }

  public filterArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length <= 1) {
      return ArraySize.error()
    }

    const metadata = this.metadata('FILTER')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    const width = Math.max(...(subChecks).map(val => val.width))
    const height = Math.max(...(subChecks).map(val => val.height))
    return new ArraySize(width, height)
  }

  /**
   * Corresponds to TAKE(array, rows, [columns]).
   *
   * Returns rows and columns from the beginning or end of the source array.
   * Syntactically empty dimensions keep all rows or columns. Counts that
   * evaluate to zero return a #N/A error.
   *
   * @param {ProcedureAst} ast - The parsed TAKE call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} The selected source values or a spreadsheet error.
   */
  public take(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    // The default supports TAKE(array, , columns), but the rows argument
    // position must still be present.
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    return this.runFunction(ast.args, state, this.metadata('TAKE'),
      (range: SimpleRangeValue, rows: number, columns: number) => {
        const sourceHeight = range.height()
        const sourceWidth = range.width()
        const requestedRows = Math.trunc(rows)
        const requestedColumns = Math.trunc(columns)

        if (requestedRows === 0 || requestedColumns === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.ZeroRowOrColumnCount)
        }

        if (sourceHeight === 0 || sourceWidth === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
        }

        const rowsToTake = Math.min(Math.abs(requestedRows), sourceHeight)
        const columnsToTake = Math.min(Math.abs(requestedColumns), sourceWidth)
        const startRow = requestedRows > 0 ? 0 : sourceHeight - rowsToTake
        const startColumn = requestedColumns > 0 ? 0 : sourceWidth - columnsToTake

        return this.sliceSourceArray(range, startRow, startColumn, rowsToTake, columnsToTake)
      }
    )
  }

  /**
   * Corresponds to DROP(array, rows, [columns]).
   *
   * Removes rows and columns from the beginning (positive counts) or the end
   * (negative counts) of the source array and returns the rest. Counts are
   * truncated toward zero; a zero, omitted, or empty count drops nothing.
   * Dropping every row or every column returns a #N/A error.
   *
   * @param {ProcedureAst} ast - The parsed DROP call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} The remaining source values or a spreadsheet error.
   */
  public drop(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DROP'),
      (range: SimpleRangeValue, rows: number, columns: number) => {
        const rowsToDrop = Math.min(Math.abs(Math.trunc(rows)), range.height())
        const columnsToDrop = Math.min(Math.abs(Math.trunc(columns)), range.width())
        const remainingRows = range.height() - rowsToDrop
        const remainingColumns = range.width() - columnsToDrop

        if (remainingRows === 0 || remainingColumns === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArray)
        }

        const startRow = rows > 0 ? rowsToDrop : 0
        const startColumn = columns > 0 ? columnsToDrop : 0

        return this.sliceSourceArray(range, startRow, startColumn, remainingRows, remainingColumns)
      }
    )
  }

  /**
   * Calculates the spilled array size of DROP. Statically known counts give
   * the exact size; counts that depend on other cells use the source size as
   * the upper bound. Dropping every row or column from a known count is
   * reported as an invalid size, so the formula evaluates to its #N/A error
   * instead of reserving space.
   *
   * @param {ProcedureAst} ast - The parsed DROP call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public dropArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return ArraySize.error()
    }

    const metadata = this.metadata('DROP')
    const sourceSize = this.arraySizeForAst(
      ast.args[0],
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)),
    )
    const rowCount = this.parseDropLiteralCount(ast.args[1])
    const columnCount = this.parseDropLiteralCount(ast.args[2])

    if (rowCount.kind === 'invalid' || columnCount.kind === 'invalid') {
      return ArraySize.error()
    }

    const effectiveSourceSize = this.effectiveSourceSize(ast.args[0], state)
    const height = this.predictDropDimension(sourceSize.height, rowCount, state.formulaAddress.row, effectiveSourceSize.height)
    const width = this.predictDropDimension(sourceSize.width, columnCount, state.formulaAddress.col, effectiveSourceSize.width)

    if (height < 1 || width < 1) {
      return ArraySize.error()
    }

    return new ArraySize(width, height)
  }

  /**
   * Calculates the spilled array size of TAKE using the source dimensions as
   * the upper bound. Finite counts are capped at the configured sheet limits.
   * Direct references that remain unbounded use their effective dimensions,
   * while computed sources use the configured limit. Unbounded dimensions are
   * valid only at the corresponding output-sheet edge.
   *
   * An unbounded result anchored away from the required sheet edge retains its
   * unbounded predicted dimension so array-space validation returns a spill
   * error without evaluating TAKE as a scalar formula.
   *
   * @param {ProcedureAst} ast - The parsed TAKE call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public takeArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return ArraySize.error()
    }

    const metadata = this.metadata('TAKE')
    const sourceSize = this.arraySizeForAst(
      ast.args[0],
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)),
    )

    const rowDimension = this.parseTakeLiteralDimension(ast.args[1])
    const columnDimension = this.parseTakeLiteralDimension(ast.args[2])

    const hasZeroDimension = (rowDimension.kind === 'value' && rowDimension.value === 0)
      || (columnDimension.kind === 'value' && columnDimension.value === 0)

    if (rowDimension.kind === 'invalid' || columnDimension.kind === 'invalid' || hasZeroDimension) {
      return ArraySize.error()
    }

    const height = rowDimension.kind === 'value'
      ? Math.min(sourceSize.height, rowDimension.value, this.config.maxRows)
      : sourceSize.height
    const width = columnDimension.kind === 'value'
      ? Math.min(sourceSize.width, columnDimension.value, this.config.maxColumns)
      : sourceSize.width
    const startsBelowFirstRow = rowDimension.kind === 'unbounded' && !Number.isFinite(height) && state.formulaAddress.row !== 0
    const startsRightOfFirstColumn = columnDimension.kind === 'unbounded' && !Number.isFinite(width) && state.formulaAddress.col !== 0
    const effectiveSourceSize = this.effectiveSourceSize(ast.args[0], state)
    const effectiveHeight = !Number.isFinite(height) ? effectiveSourceSize.height : height
    const effectiveWidth = !Number.isFinite(width) ? effectiveSourceSize.width : width

    if (startsBelowFirstRow || startsRightOfFirstColumn) {
      return new ArraySize(width, height)
    }

    if (effectiveHeight < 1 || effectiveWidth < 1) {
      return ArraySize.error()
    }

    return new ArraySize(effectiveWidth, effectiveHeight)
  }

  /**
   * Corresponds to WRAPROWS(vector, wrap_count, [pad_with]).
   *
   * Wraps a one-dimensional vector into rows of `wrap_count` values.
   *
   * @param {ProcedureAst} ast - The parsed WRAPROWS call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} The wrapped values or a spreadsheet error.
   */
  public wraprows(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.wrap(ast, state, 'WRAPROWS')
  }

  /**
   * Corresponds to WRAPCOLS(vector, wrap_count, [pad_with]).
   *
   * Wraps a one-dimensional vector into columns of `wrap_count` values.
   *
   * @param {ProcedureAst} ast - The parsed WRAPCOLS call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} The wrapped values or a spreadsheet error.
   */
  public wrapcols(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.wrap(ast, state, 'WRAPCOLS')
  }

  /**
   * Calculates the spilled array size of WRAPROWS (see `wrapArraySize`).
   *
   * @param {ProcedureAst} ast - The parsed WRAPROWS call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public wraprowsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.wrapArraySize(ast, state, 'WRAPROWS')
  }

  /**
   * Calculates the spilled array size of WRAPCOLS (see `wrapArraySize`).
   *
   * @param {ProcedureAst} ast - The parsed WRAPCOLS call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public wrapcolsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.wrapArraySize(ast, state, 'WRAPCOLS')
  }

  /**
   * Corresponds to EXPAND(array, rows, [columns], [pad_with]).
   *
   * Pads an array to `rows` rows and `columns` columns with `pad_with`, or
   * with #N/A when `pad_with` is omitted (an empty `pad_with` pads with blank
   * cells). An omitted or empty `rows` or `columns` keeps the array's size.
   * Counts are truncated toward zero. A count smaller than the array returns
   * #VALUE!, and more than 1,048,576 rows return #NUM!. A result larger than
   * the configured sheet size (`maxRows`, `maxColumns`) returns #VALUE!,
   * checked before the result is built, as for SEQUENCE. An array or a range
   * as `pad_with` returns #VALUE!, and so does an empty result (a kept
   * dimension of a whole column or row with no data).
   *
   * @param {ProcedureAst} ast - The parsed EXPAND call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} The padded array or a spreadsheet error.
   */
  public expand(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EXPAND'),
      (array: SimpleRangeValue, rowsArgument: InternalScalarValue, columnsArgument: Maybe<InternalScalarValue>, padWith: Maybe<InternalScalarValue>) => {
        if (this.isArrayArgument(ast.args[3], state)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
        }

        const rows = this.coerceExpandDimension(ast.args[1], rowsArgument, array.height())
        if (rows instanceof CellError) {
          return rows
        }

        const columns = this.coerceExpandDimension(ast.args[2], columnsArgument, array.width())
        if (columns instanceof CellError) {
          return columns
        }

        if (rows < array.height() || columns < array.width()) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueSmall)
        }

        if (rows > EXPAND_MAX_ROWS) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }

        if (rows > this.config.maxRows || columns > this.config.maxColumns) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }

        if (rows === 0 || columns === 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.EmptyRange)
        }

        const result = array.data.map(row => this.padRowToWidth(row, columns, padWith))
        while (result.length < rows) {
          result.push(this.padRowToWidth([], columns, padWith))
        }

        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /**
   * Calculates the spilled array size of EXPAND. Statically known counts give
   * the exact size, and an omitted or empty count keeps the source dimension.
   * A count that depends on other cells cannot be known before evaluation, so
   * the formula is a single cell, as for SEQUENCE: a larger result returns
   * #VALUE!. So is a kept dimension of a source whose size cannot be predicted
   * (such as a named expression), and every count that makes EXPAND return an
   * error (including a result larger than the configured sheet size), so the
   * formula evaluates to that error instead of reserving space.
   *
   * A kept dimension of a whole-column (whole-row) source spans the effective
   * size of the source, and fits only when the formula starts in the first row
   * (column); otherwise it stays unbounded, which makes array-space
   * validation report a spill error.
   *
   * @param {ProcedureAst} ast - The parsed EXPAND call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public expandArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 4 || this.isArrayArgument(ast.args[3], state)) {
      return ArraySize.error()
    }

    const rows = this.parseExpandLiteralDimension(ast.args[1])
    const columns = this.parseExpandLiteralDimension(ast.args[2])
    if (rows.kind === 'invalid' || rows.kind === 'unresolved' || columns.kind === 'invalid' || columns.kind === 'unresolved') {
      return ArraySize.error()
    }

    const sourceSize = this.predictSourceSize(ast.args[0], state, 'EXPAND')
    if ((rows.kind === 'kept' || columns.kind === 'kept') && this.isUnpredictedSize(ast.args[0], sourceSize)) {
      return ArraySize.error()
    }

    const effectiveSourceSize = this.effectiveSourceSize(ast.args[0], state)
    const sourceHeight = Number.isFinite(sourceSize.height) ? sourceSize.height : effectiveSourceSize.height
    const sourceWidth = Number.isFinite(sourceSize.width) ? sourceSize.width : effectiveSourceSize.width
    const height = rows.kind === 'value' ? Math.trunc(rows.value) : sourceHeight
    const width = columns.kind === 'value' ? Math.trunc(columns.value) : sourceWidth

    if (
      height < sourceHeight || width < sourceWidth || height > EXPAND_MAX_ROWS
      || height > this.config.maxRows || width > this.config.maxColumns
      || height < 1 || width < 1
    ) {
      return ArraySize.error()
    }

    const keepsUnboundedHeight = rows.kind === 'kept' && !Number.isFinite(sourceSize.height) && state.formulaAddress.row !== 0
    const keepsUnboundedWidth = columns.kind === 'kept' && !Number.isFinite(sourceSize.width) && state.formulaAddress.col !== 0

    return new ArraySize(
      keepsUnboundedWidth ? Number.POSITIVE_INFINITY : width,
      keepsUnboundedHeight ? Number.POSITIVE_INFINITY : height,
    )
  }

  /**
   * Shared implementation of WRAPROWS and WRAPCOLS.
   *
   * Cuts the vector into lines of `wrap_count` values, rows for WRAPROWS and
   * columns for WRAPCOLS; a line is never longer than the vector. The last
   * line is padded with `pad_with`, or with #N/A when `pad_with` is omitted or
   * empty. `wrap_count` is truncated toward zero. A two-dimensional vector or
   * an empty or blank one returns #VALUE!, and a `wrap_count` below 1 returns
   * #NUM!. Runs in time proportional to the vector's length.
   *
   * @param {ProcedureAst} ast - The parsed WRAPROWS or WRAPCOLS call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @param {WrapFunctionName} functionName - Which of the two functions is evaluated.
   * @returns {InterpreterValue} The wrapped values or a spreadsheet error.
   */
  private wrap(ast: ProcedureAst, state: InterpreterState, functionName: WrapFunctionName): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(functionName),
      (vector: SimpleRangeValue, wrapCountArgument: InternalScalarValue, padWithArgument: Maybe<InternalScalarValue>) => {
        const wrapCount = this.coerceCount(wrapCountArgument)
        if (wrapCount instanceof CellError) {
          return wrapCount
        }

        if (vector.width() > 1 && vector.height() > 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.WrongDimension)
        }

        const elements = vector.height() === 1 ? vector.data[0] : vector.data.map(row => row[0])
        if (elements.length === 0 || (elements.length === 1 && elements[0] === EmptyValue)) {
          return new CellError(ErrorType.VALUE, this.isOmittedArgument(ast.args[0]) ? ErrorMessage.EmptyArg : ErrorMessage.EmptyRange)
        }

        if (wrapCount < 1) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }

        const padWith = this.isOmittedArgument(ast.args[2]) ? undefined : padWithArgument
        const lineLength = Math.min(wrapCount, elements.length)
        const lines = Array.from({length: Math.ceil(elements.length / lineLength)}, (_, line) =>
          this.padRowToWidth(elements.slice(line * lineLength, (line + 1) * lineLength), lineLength, padWith)
        )

        return SimpleRangeValue.onlyValues(functionName === 'WRAPROWS'
          ? lines
          : lines[0].map((_, position) => lines.map(line => line[position]))
        )
      }
    )
  }

  /**
   * Calculates the spilled array size of WRAPROWS and WRAPCOLS. A statically
   * known `wrap_count` gives the exact size: lines of the smaller of
   * `wrap_count` and the vector's length, as many as needed to hold the
   * vector. A `wrap_count` that depends on other cells cannot be known before
   * evaluation, so the formula is a single cell, as for SEQUENCE: a larger
   * result returns #VALUE!. So is a two-dimensional source and every count
   * that makes the function return an error, so the formula evaluates to that
   * error instead of reserving space.
   *
   * A whole-column (whole-row) vector is measured by its effective size. The
   * number of lines grows with it, so the result fits only when the formula
   * starts in the first row (column); otherwise that dimension stays
   * unbounded, which makes array-space validation report a spill error.
   *
   * @param {ProcedureAst} ast - The parsed WRAPROWS or WRAPCOLS call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @param {WrapFunctionName} functionName - Which of the two functions is predicted.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  private wrapArraySize(ast: ProcedureAst, state: InterpreterState, functionName: WrapFunctionName): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return ArraySize.error()
    }

    const sourceSize = this.predictSourceSize(ast.args[0], state, functionName)
    const wrapCount = this.parseLiteralCount(ast.args[1])
    if (wrapCount.kind !== 'value' || Math.trunc(wrapCount.value) < 1 || (sourceSize.width > 1 && sourceSize.height > 1)) {
      return ArraySize.error()
    }

    const effectiveSourceSize = this.effectiveSourceSize(ast.args[0], state)
    const length = (Number.isFinite(sourceSize.height) ? sourceSize.height : effectiveSourceSize.height)
      * (Number.isFinite(sourceSize.width) ? sourceSize.width : effectiveSourceSize.width)
    if (length < 1) {
      return ArraySize.error()
    }

    const lineLength = Math.min(Math.trunc(wrapCount.value), length)
    const startsAwayFromSheetEdge = (!Number.isFinite(sourceSize.height) && state.formulaAddress.row !== 0)
      || (!Number.isFinite(sourceSize.width) && state.formulaAddress.col !== 0)
    const lineCount = startsAwayFromSheetEdge ? Number.POSITIVE_INFINITY : Math.ceil(length / lineLength)

    return functionName === 'WRAPROWS'
      ? new ArraySize(lineLength, lineCount)
      : new ArraySize(lineCount, lineLength)
  }

  /**
   * Predicts the size of a WRAPROWS, WRAPCOLS or EXPAND source, with array
   * arithmetic enabled for it as the function's metadata requests.
   *
   * @param {Ast} source - The source expression.
   * @param {InterpreterState} state - The formula state.
   * @param {WrapFunctionName | 'EXPAND'} functionName - The function whose metadata drives the array-arithmetic flag.
   * @returns {ArraySize} The predicted source size.
   */
  private predictSourceSize(source: Ast, state: InterpreterState, functionName: WrapFunctionName | 'EXPAND'): ArraySize {
    const metadata = this.metadata(functionName)
    return this.arraySizeForAst(
      source,
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata.enableArrayArithmeticForArguments ?? false)),
    )
  }

  /**
   * Classifies an EXPAND `rows` or `columns` expression before evaluation. An
   * omitted or empty count keeps the source dimension.
   *
   * @param {Ast | undefined} argument - The count expression to classify.
   * @returns {ExpandLiteralDimension} The constant count, or its kept, invalid, or unresolved classification.
   */
  private parseExpandLiteralDimension(argument: Ast | undefined): ExpandLiteralDimension {
    return this.isOmittedArgument(argument) ? {kind: 'kept'} : this.parseLiteralCount(argument)
  }

  /**
   * Coerces an EXPAND `rows` or `columns` value. An omitted or empty count
   * keeps the source dimension; any other value is coerced as a count.
   *
   * @param {Ast | undefined} argument - The count expression, to tell an empty count from a blank cell.
   * @param {Maybe<InternalScalarValue>} value - The evaluated count.
   * @param {number} sourceDimension - The array's height or width.
   * @returns {number | CellError} The dimension of the result or an error.
   */
  private coerceExpandDimension(argument: Ast | undefined, value: Maybe<InternalScalarValue>, sourceDimension: number): number | CellError {
    return value === undefined || this.isOmittedArgument(argument) ? sourceDimension : this.coerceCount(value)
  }

  /**
   * Coerces a WRAPROWS or WRAPCOLS `wrap_count`, or an EXPAND `rows` or
   * `columns` value, to a number truncated toward zero. Errors are returned as
   * they are; numeric text, logical values and blank cells convert as for any
   * number; empty text returns #VALUE!.
   *
   * @param {InternalScalarValue} value - The count.
   * @returns {number | CellError} The truncated number or an error.
   */
  private coerceCount(value: InternalScalarValue): number | CellError {
    if (value === '') {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
    }

    const coerced = this.arithmeticHelper.coerceScalarToNumberOrError(value)
    return coerced instanceof CellError ? coerced : Math.trunc(getRawValue(coerced))
  }

  /**
   * Tells whether an optional argument is omitted or syntactically empty.
   *
   * @param {Ast | undefined} argument - The argument expression, if any.
   * @returns {boolean} True when the argument is omitted or empty.
   */
  private isOmittedArgument(argument: Ast | undefined): boolean {
    return argument === undefined || argument.type === AstNodeType.EMPTY
  }

  /**
   * Tells whether an EXPAND `pad_with` is an array or a multi-cell range,
   * judged by its size with array arithmetic enabled.
   *
   * @param {Ast | undefined} argument - The `pad_with` expression, if any.
   * @param {InterpreterState} state - The formula state.
   * @returns {boolean} True when `pad_with` holds more than one value.
   */
  private isArrayArgument(argument: Ast | undefined, state: InterpreterState): boolean {
    if (argument === undefined || this.isOmittedArgument(argument)) {
      return false
    }

    const size = this.arraySizeForAst(argument, new InterpreterState(state.formulaAddress, true))
    return size.width !== 1 || size.height !== 1
  }

  /**
   * Tells whether an EXPAND source has a size that cannot be predicted before
   * evaluation, such as a named expression or a function whose result size
   * depends on cell values. Size prediction reports such a source as one cell,
   * which only a cell reference, a one-cell range or an empty argument really is.
   *
   * @param {Ast} source - The source argument.
   * @param {ArraySize} sourceSize - The predicted size of the source.
   * @returns {boolean} True when the source's real size is unknown.
   */
  private isUnpredictedSize(source: Ast, sourceSize: ArraySize): boolean {
    let argument = source
    while (argument.type === AstNodeType.PARENTHESIS) {
      argument = argument.expression
    }

    return sourceSize.isRef
      && sourceSize.width === 1
      && sourceSize.height === 1
      && argument.type !== AstNodeType.CELL_REFERENCE
      && argument.type !== AstNodeType.CELL_RANGE
      && argument.type !== AstNodeType.EMPTY
  }

  /**
   * Corresponds to VSTACK(array1, [array2], ...)
   *
   * Stacks the input arrays vertically, one on top of another, into a single array.
   * The result has as many rows as the inputs combined and as many columns as the
   * widest input. Cells of narrower inputs are padded on the right with the #N/A
   * error, matching the behaviour of Excel and Google Sheets.
   *
   * @param ast
   * @param state
   */
  public vstack(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VSTACK'), (...ranges: SimpleRangeValue[]) => {
      const width = Math.max(...ranges.map(range => range.width()))
      const result: InternalScalarValue[][] = []

      for (const range of ranges) {
        for (const row of range.data) {
          result.push(this.padRowToWidth(row, width))
        }
      }

      return SimpleRangeValue.onlyValues(result)
    })
  }

  /**
   * Calculates the spilled array size of VSTACK: the width is the widest input
   * and the height is the sum of all input heights.
   *
   * @param ast
   * @param state
   */
  public vstackArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) {
      return ArraySize.error()
    }

    const subChecks = this.stackSubChecks(ast, state, 'VSTACK')
    const width = Math.max(...subChecks.map(size => size.width))
    const height = subChecks.reduce((total, size) => total + size.height, 0)
    return new ArraySize(width, height)
  }

  /**
   * Corresponds to HSTACK(array1, [array2], ...)
   *
   * Stacks the input arrays horizontally, side by side, into a single array.
   * The result has as many columns as the inputs combined and as many rows as the
   * tallest input. Cells of shorter inputs are padded at the bottom with the #N/A
   * error, matching the behaviour of Excel and Google Sheets.
   *
   * @param ast
   * @param state
   */
  public hstack(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HSTACK'), (...ranges: SimpleRangeValue[]) => {
      const height = Math.max(...ranges.map(range => range.height()))
      const result: InternalScalarValue[][] = [...Array(height).keys()].map(() => [])

      for (const range of ranges) {
        const data = range.data
        const width = range.width()
        for (let row = 0; row < height; row++) {
          const sourceRow = row < data.length ? data[row] : undefined
          for (let col = 0; col < width; col++) {
            // Pad both missing rows (sourceRow === undefined) and short rows
            // (col beyond the row's length) with #N/A, exactly as VSTACK does.
            result[row].push(sourceRow !== undefined && col < sourceRow.length
              ? sourceRow[col]
              : new CellError(ErrorType.NA, ErrorMessage.ValueNotFound))
          }
        }
      }

      return SimpleRangeValue.onlyValues(result)
    })
  }

  /**
   * Calculates the spilled array size of HSTACK: the width is the sum of all
   * input widths and the height is the tallest input.
   *
   * @param ast
   * @param state
   */
  public hstackArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) {
      return ArraySize.error()
    }

    const subChecks = this.stackSubChecks(ast, state, 'HSTACK')
    const width = subChecks.reduce((total, size) => total + size.width, 0)
    const height = Math.max(...subChecks.map(size => size.height))
    return new ArraySize(width, height)
  }

  /**
   * Resolves the array size of every argument of a stacking function, enabling
   * array arithmetic for the arguments when the function's metadata requests it.
   *
   * @param ast
   * @param state
   * @param functionName - the stacking function whose metadata drives the array-arithmetic flag
   */
  private stackSubChecks(ast: ProcedureAst, state: InterpreterState, functionName: 'VSTACK' | 'HSTACK'): ArraySize[] {
    const metadata = this.metadata(functionName)
    return ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
  }

  /**
   * Returns a copy of the given row resized to exactly `width` cells: longer
   * rows are truncated and shorter rows are padded on the right with
   * `padWith`, or with #N/A when it is omitted. Used by VSTACK to align every
   * stacked row to the widest input, and by WRAPROWS, WRAPCOLS and EXPAND to
   * pad their short lines.
   *
   * @param {InternalScalarValue[]} row - the source row to resize
   * @param {number} width - the target number of cells
   * @param {InternalScalarValue} [padWith] - the value of each added cell; #N/A when omitted
   * @returns {InternalScalarValue[]} the resized copy of the row
   */
  private padRowToWidth(row: InternalScalarValue[], width: number, padWith?: InternalScalarValue): InternalScalarValue[] {
    if (row.length >= width) {
      return row.slice(0, width)
    }
    const padded = row.slice()
    while (padded.length < width) {
      padded.push(padWith ?? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound))
    }
    return padded
  }
}
