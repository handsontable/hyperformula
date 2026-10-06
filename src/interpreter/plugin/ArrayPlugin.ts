/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {BooleanPlugin} from './BooleanPlugin'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Classifies a TAKE or DROP count expression whose value may be known before evaluation.
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

export class ArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayPlugin> {
  /**
   * Evaluates the dependency-free subset of TAKE and DROP count expressions
   * used for static result-size prediction.
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

    if (!Number.isFinite(sourceDimension) && count.kind === 'value' && anchor > requestedDrop) {
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
   * rows are truncated and shorter rows are padded on the right with #N/A. Used
   * by VSTACK to align every stacked row to the widest input.
   *
   * @param row - the source row to resize
   * @param width - the target number of cells
   */
  private padRowToWidth(row: InternalScalarValue[], width: number): InternalScalarValue[] {
    if (row.length >= width) {
      return row.slice(0, width)
    }
    const padded = row.slice()
    while (padded.length < width) {
      padded.push(new CellError(ErrorType.NA, ErrorMessage.ValueNotFound))
    }
    return padded
  }
}
