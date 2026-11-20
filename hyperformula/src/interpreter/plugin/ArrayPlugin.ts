/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ArrayFormulaVertex, EmptyCellVertex} from '../../DependencyGraph'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {BooleanPlugin} from './BooleanPlugin'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/** A CHOOSECOLS or CHOOSEROWS index classified without evaluating a formula expression. */
type ChooseLiteralIndex =
  | {kind: 'value', value: number}
  | {kind: 'invalid'}
  | {kind: 'unresolved'}

/** The source dimension that CHOOSECOLS (columns) or CHOOSEROWS (rows) picks from. */
type ChooseAxis = 'columns' | 'rows'

/** The functions that share the CHOOSECOLS and CHOOSEROWS implementation. */
type ChooseFunctionName = 'CHOOSECOLS' | 'CHOOSEROWS'

/**
 * Classifies a TAKE or DROP count, a WRAPROWS or WRAPCOLS `wrap_count`, an EXPAND `rows` or `columns`,
 * a TRIMRANGE code expression, or a TOROW or TOCOL `ignore` value, whose value may be known before evaluation.
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
 * The functions that flatten an array into a single row or column.
 *
 * @internal
 */
type FlattenFunction = 'TOROW' | 'TOCOL'

/** TOROW and TOCOL `ignore` value that keeps every element. */
const IGNORE_NOTHING = 0
/** TOROW and TOCOL `ignore` value that skips blank cells. */
const IGNORE_BLANKS = 1
/** TOROW and TOCOL `ignore` value that skips errors. */
const IGNORE_ERRORS = 2
/** TOROW and TOCOL `ignore` value that skips blank cells and errors. */
const IGNORE_BLANKS_AND_ERRORS = 3

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

/**
 * The rows and columns of a TRIMRANGE source that hold content, relative to the source.
 *
 * @internal
 */
interface ContentBounds {
  top: number,
  bottom: number,
  left: number,
  right: number,
}

/**
 * TRIMRANGE trim codes: 0 trims nothing, 1 leading blank lines, 2 trailing blank lines, 3 both.
 */
const TRIM_LEADING = 1
const TRIM_TRAILING = 2
const TRIM_BOTH = 3

export class ArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayPlugin> {
  /**
   * Classifies an index literal for static CHOOSECOLS and CHOOSEROWS result-size prediction.
   *
   * @param {Ast} argument - The index argument to inspect without evaluating formulas.
   * @returns {ChooseLiteralIndex} A coerced literal value, an invalid marker, or an unresolved marker.
   */
  private parseChooseLiteralIndex(argument: Ast): ChooseLiteralIndex {
    if (argument.type === AstNodeType.NUMBER) {
      return {kind: 'value', value: Math.trunc(argument.value)}
    }

    if (argument.type === AstNodeType.STRING) {
      const coercedValue = this.arithmeticHelper.coerceToMaybeNumber(argument.value)
      if (coercedValue === undefined) {
        return {kind: 'invalid'}
      }
      return {kind: 'value', value: Math.trunc(getRawValue(coercedValue))}
    }

    if (argument.type === AstNodeType.EMPTY || argument.type === AstNodeType.ERROR || argument.type === AstNodeType.ERROR_WITH_RAW_INPUT) {
      return {kind: 'invalid'}
    }

    if (argument.type === AstNodeType.PLUS_UNARY_OP || argument.type === AstNodeType.MINUS_UNARY_OP) {
      const index = this.parseChooseLiteralIndex(argument.value)
      if (index.kind !== 'value') {
        return index
      }
      return {
        kind: 'value',
        value: argument.type === AstNodeType.MINUS_UNARY_OP ? -index.value : index.value,
      }
    }

    if (argument.type === AstNodeType.PARENTHESIS) {
      return this.parseChooseLiteralIndex(argument.expression)
    }

    return {kind: 'unresolved'}
  }

  /**
   * Evaluates the dependency-free subset of TAKE and DROP count expressions,
   * of WRAPROWS and WRAPCOLS `wrap_count` expressions, of EXPAND `rows`
   * and `columns` expressions, of TRIMRANGE code expressions, and of TOROW
   * and TOCOL `ignore` expressions, used for static result-size prediction.
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
   * Resolves a direct TAKE, DROP, TRIMRANGE, TOROW or TOCOL source reference without
   * evaluating its values. The range supplies materialized dimensions, and for
   * TOROW and TOCOL also its sheet.
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
   * Measures a TAKE, DROP, TRIMRANGE, TOROW or TOCOL source whose predicted size is unbounded. A direct
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
    'CHOOSECOLS': {
      method: 'choosecols',
      sizeOfResultArrayMethod: 'choosecolsArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
      repeatLastArgs: 1,
      vectorizationForbidden: true,
    },
    'CHOOSEROWS': {
      method: 'chooserows',
      sizeOfResultArrayMethod: 'chooserowsArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
      repeatLastArgs: 1,
      vectorizationForbidden: true,
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
        {argumentType: FunctionArgumentType.NUMBER},
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
    'TOROW': {
      method: 'torow',
      sizeOfResultArrayMethod: 'torowArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: IGNORE_NOTHING, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: false, emptyAsDefault: true},
      ],
      vectorizationForbidden: true,
    },
    'TOCOL': {
      method: 'tocol',
      sizeOfResultArrayMethod: 'tocolArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: IGNORE_NOTHING, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: false, emptyAsDefault: true},
      ],
      vectorizationForbidden: true,
    },
    'TRIMRANGE': {
      method: 'trimrange',
      sizeOfResultArrayMethod: 'trimrangeArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        // Coerced in the method: an empty text is #VALUE!, and both codes are coerced before either is range-checked.
        // SCALAR, so that an error in either code reaches the method and the codes are checked in order.
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true, defaultValue: TRIM_BOTH, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true, defaultValue: TRIM_BOTH, emptyAsDefault: true},
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
          for (let k = 0; k < rangeFilters.length; k++) {
            const condition = rangeFilters[k].data[i][j]
            // The first condition is Excel's `include`: text in it, even "TRUE", which coerceScalarToBoolean would
            // accept, returns #VALUE!, and an error in it is returned. Further conditions are HyperFormula's own
            // extension and keep dropping such rows.
            if (k === 0 && typeof condition === 'string') {
              return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
            }
            const val = coerceScalarToBoolean(condition)
            if (k === 0 && val instanceof CellError) {
              return val
            }
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
        return new CellError(ErrorType.CALC, ErrorMessage.EmptyRange)
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
   * Corresponds to CHOOSECOLS(array, col_num1, [col_num2], ...).
   *
   * Returns the requested source columns in argument order. Positive indexes
   * count from the left, negative indexes count from the right, and duplicate
   * indexes duplicate their columns in the result.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @returns {InterpreterValue} The selected source columns or a spreadsheet error.
   */
  public choosecols(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.chooseAlongAxis(ast, state, 'CHOOSECOLS', 'columns')
  }

  /**
   * Predicts the CHOOSECOLS spill size from the source height and index count.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public choosecolsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.chooseArraySize(ast, state, 'CHOOSECOLS', 'columns')
  }

  /**
   * Corresponds to CHOOSEROWS(array, row_num1, [row_num2], ...).
   *
   * Returns the requested source rows in argument order. Positive indexes
   * count from the top, negative indexes count from the bottom, and duplicate
   * indexes duplicate their rows in the result.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @returns {InterpreterValue} The selected source rows or a spreadsheet error.
   */
  public chooserows(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.chooseAlongAxis(ast, state, 'CHOOSEROWS', 'rows')
  }

  /**
   * Predicts the CHOOSEROWS spill size from the source width and index count.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public chooserowsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.chooseArraySize(ast, state, 'CHOOSEROWS', 'rows')
  }

  /**
   * Shared implementation of CHOOSECOLS and CHOOSEROWS: returns the source
   * columns or rows named by the indexes, in argument order.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @param {ChooseFunctionName} functionName - The function whose metadata drives argument handling.
   * @param {ChooseAxis} axis - The source dimension the indexes pick from.
   * @returns {InterpreterValue} The selected source columns or rows, or a spreadsheet error.
   */
  private chooseAlongAxis(ast: ProcedureAst, state: InterpreterState, functionName: ChooseFunctionName, axis: ChooseAxis): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(functionName),
      (range: SimpleRangeValue, ...indexNumbers: number[]) => {
        const sourceWidth = range.width()
        const sourceHeight = range.height()

        if (sourceHeight === 0 || sourceWidth === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
        }

        const chosenLength = axis === 'columns' ? sourceWidth : sourceHeight
        const indexes = indexNumbers.map(indexNumber => Math.trunc(indexNumber))

        if (indexes.some(index =>
          !Number.isFinite(index) || index === 0 || Math.abs(index) > chosenLength
        )) {
          return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
        }

        const zeroBasedIndexes = indexes.map(index =>
          index > 0 ? index - 1 : chosenLength + index
        )

        const sourceRange = range.range
        const startsRightOfFirstColumn = axis === 'rows'
          && sourceRange !== undefined
          && !Number.isFinite(sourceRange.width())
          && state.formulaAddress.col !== 0

        if (startsRightOfFirstColumn) {
          return new CellError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult)
        }

        if (sourceRange !== undefined) {
          const selectedLines = zeroBasedIndexes.map(index => {
            const lineRange = axis === 'columns'
              ? AbsoluteCellRange.spanFrom(sourceRange.getAddress(index, 0), 1, sourceHeight)
              : AbsoluteCellRange.spanFrom(sourceRange.getAddress(0, index), sourceWidth, 1)
            return SimpleRangeValue.onlyRange(lineRange, this.dependencyGraph).data
          })
          const result = axis === 'columns'
            ? Array.from({length: sourceHeight}, (_, row) => selectedLines.map(column => column[row][0]))
            : selectedLines.map(row => row[0])
          return SimpleRangeValue.onlyValues(result)
        }

        const result = axis === 'columns'
          ? range.data.map(row => zeroBasedIndexes.map(index => row[index]))
          : zeroBasedIndexes.map(index => range.data[index])
        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /**
   * Predicts the CHOOSECOLS or CHOOSEROWS spill size: one result column or
   * row per index, each as long as the source's other dimension.
   *
   * Invalid literals are rejected before spill allocation. A whole-column
   * (CHOOSECOLS) or whole-row (CHOOSEROWS) result spills only from the first
   * output row or column, where its source range supplies the materialized
   * spill length. Below the first row a whole-column CHOOSECOLS result keeps
   * its unbounded height, so array-space validation returns a spill error
   * while the formula still evaluates inside another function. Outside the
   * first column a whole-row CHOOSEROWS result is an invalid size.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @param {ChooseFunctionName} functionName - The function whose metadata drives argument handling.
   * @param {ChooseAxis} axis - The source dimension the indexes pick from.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  private chooseArraySize(ast: ProcedureAst, state: InterpreterState, functionName: ChooseFunctionName, axis: ChooseAxis): ArraySize {
    if (ast.args.length < 2) {
      return ArraySize.error()
    }

    const metadata = this.metadata(functionName)
    const sourceSize = this.arraySizeForAst(
      ast.args[0],
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)),
    )
    const chosenLength = axis === 'columns' ? sourceSize.width : sourceSize.height
    const keptLength = axis === 'columns' ? sourceSize.height : sourceSize.width

    let sourceAst = ast.args[0]
    while (sourceAst.type === AstNodeType.PARENTHESIS) {
      sourceAst = sourceAst.expression
    }

    if (axis === 'rows' && this.isUnpredictedSize(sourceAst, sourceSize)) {
      return ArraySize.error()
    }

    const startsOutsideFirstLine = !Number.isFinite(keptLength) && (axis === 'columns'
      ? state.formulaAddress.row !== 0
      : state.formulaAddress.col !== 0)
    const sourceRange = sourceAst.type === (axis === 'columns' ? AstNodeType.COLUMN_RANGE : AstNodeType.ROW_RANGE)
      ? AbsoluteCellRange.fromAstOrUndef(sourceAst, state.formulaAddress)
      : undefined
    let effectiveKeptLength = keptLength
    if (!Number.isFinite(keptLength) && sourceRange !== undefined) {
      effectiveKeptLength = axis === 'columns'
        ? sourceRange.effectiveHeight(this.dependencyGraph)
        : sourceRange.effectiveWidth(this.dependencyGraph)
    }

    for (const argument of ast.args.slice(1)) {
      const index = this.parseChooseLiteralIndex(argument)
      if (
        index.kind === 'invalid'
        || (index.kind === 'value' && (
          !Number.isFinite(index.value)
          || index.value === 0
          || Math.abs(index.value) > chosenLength
        ))
      ) {
        return ArraySize.error()
      }
    }

    const indexCount = ast.args.length - 1
    if (startsOutsideFirstLine && axis === 'columns') {
      return new ArraySize(indexCount, keptLength)
    }

    if (startsOutsideFirstLine || effectiveKeptLength < 1) {
      return ArraySize.error()
    }

    return axis === 'columns'
      ? new ArraySize(indexCount, effectiveKeptLength)
      : new ArraySize(effectiveKeptLength, indexCount)
  }

  /**
   * Tells whether a CHOOSEROWS source has a size that cannot be predicted
   * before evaluation, such as a named expression or a function whose result
   * size depends on cell values. Size prediction reports such a source as
   * one cell, which only a cell reference or a one-cell range really is.
   *
   * @param {Ast} sourceAst - The source argument, without enclosing parentheses.
   * @param {ArraySize} sourceSize - The predicted size of the source.
   * @returns {boolean} True when the source's real size is unknown.
   */
  private isUnpredictedSize(sourceAst: Ast, sourceSize: ArraySize): boolean {
    return sourceSize.isRef
      && sourceSize.width === 1
      && sourceSize.height === 1
      && sourceAst.type !== AstNodeType.CELL_REFERENCE
      && sourceAst.type !== AstNodeType.CELL_RANGE
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
    // rows is required but may be left empty, as in TAKE(array, , columns), which keeps
    // every row; a default would make the metadata report it as optional.
    const rowsLeftEmpty = ast.args[1]?.type === AstNodeType.EMPTY

    return this.runFunction(ast.args, state, this.metadata('TAKE'),
      (range: SimpleRangeValue, rows: number, columns: number) => {
        const sourceHeight = range.height()
        const sourceWidth = range.width()
        const requestedRows = rowsLeftEmpty ? Number.POSITIVE_INFINITY : Math.trunc(rows)
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

    return this.sizeAtSheetEdge(
      ast.args[0], state, width, height, columnDimension.kind === 'unbounded', rowDimension.kind === 'unbounded',
    )
  }

  /**
   * Corresponds to TOROW(array, [ignore], [scan_by_column]).
   *
   * Returns the elements of the source array in a single row. See `flatten`
   * for the arguments and errors.
   *
   * @param {ProcedureAst} ast - The parsed TOROW call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} A one-row array or a spreadsheet error.
   */
  public torow(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.flatten(ast, state, 'TOROW')
  }

  /**
   * Corresponds to TOCOL(array, [ignore], [scan_by_column]).
   *
   * Returns the elements of the source array in a single column. See
   * `flatten` for the arguments and errors.
   *
   * @param {ProcedureAst} ast - The parsed TOCOL call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} A one-column array or a spreadsheet error.
   */
  public tocol(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.flatten(ast, state, 'TOCOL')
  }

  /**
   * Calculates the spilled array size of TOROW. See `flattenArraySize`.
   *
   * @param {ProcedureAst} ast - The parsed TOROW call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public torowArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.flattenArraySize(ast, state, 'TOROW')
  }

  /**
   * Calculates the spilled array size of TOCOL. See `flattenArraySize`.
   *
   * @param {ProcedureAst} ast - The parsed TOCOL call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public tocolArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.flattenArraySize(ast, state, 'TOCOL')
  }

  /**
   * Flattens the source array into a single row (TOROW) or column (TOCOL).
   *
   * The source is read row by row, or column by column when `scan_by_column`
   * is true. `ignore` selects the elements left out: 0 keeps every element,
   * 1 skips blank cells, 2 skips errors, 3 skips both; it is truncated toward
   * zero. Empty text is not blank and is kept. An empty `array` argument and
   * an `ignore` value outside 0 to 3 return #VALUE!, and a result with no
   * elements returns #CALC!.
   *
   * `ignore` and `scan_by_column` are coerced here rather than by the
   * argument metadata: both reject empty text with #VALUE!, and their errors
   * come in Excel's order: an `ignore` that is not a number, then an invalid
   * `scan_by_column`, then an `ignore` outside 0 to 3.
   *
   * @param {ProcedureAst} ast - The parsed TOROW or TOCOL call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @param {FlattenFunction} functionName - The function whose metadata and orientation apply.
   * @returns {InterpreterValue} The flattened elements or a spreadsheet error.
   */
  private flatten(ast: ProcedureAst, state: InterpreterState, functionName: FlattenFunction): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(functionName),
      (source: SimpleRangeValue, ignoreArgument: InternalScalarValue, scanByColumnArgument: InternalScalarValue) => {
        if (ast.args[0].type === AstNodeType.EMPTY) {
          return new CellError(ErrorType.VALUE, ErrorMessage.EmptyArg)
        }

        const ignore = this.coerceCount(ignoreArgument)
        if (ignore instanceof CellError) {
          return ignore
        }

        const scanByColumn = this.coerceFlattenScanByColumn(scanByColumnArgument)
        if (scanByColumn instanceof CellError) {
          return scanByColumn
        }

        if (ignore < IGNORE_NOTHING) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueSmall)
        }
        if (ignore > IGNORE_BLANKS_AND_ERRORS) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }

        const elements = this.collectFlattenElements(source, ignore, scanByColumn)
        if (elements.length === 0) {
          return new CellError(ErrorType.CALC, ErrorMessage.EmptyArray)
        }

        return SimpleRangeValue.onlyValues(functionName === 'TOCOL' ? elements.map(element => [element]) : [elements])
      }
    )
  }

  /**
   * Coerces the TOROW or TOCOL `scan_by_column` argument to a logical value.
   * Numbers, blank cells and the texts "TRUE" and "FALSE" convert as for any
   * logical value; empty and other text return #VALUE!.
   *
   * @param {InternalScalarValue} value - The `scan_by_column` argument.
   * @returns {boolean | CellError} The logical value or an error.
   */
  private coerceFlattenScanByColumn(value: InternalScalarValue): boolean | CellError {
    const coerced = value === '' ? undefined : coerceScalarToBoolean(value)
    return coerced ?? new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
  }

  /**
   * Reads the source elements in scan order, leaving out the blank cells and
   * errors that `ignore` selects. Runs in time proportional to the number of
   * source elements.
   *
   * @param {SimpleRangeValue} source - The evaluated source array.
   * @param {number} ignore - The `ignore` value, from 0 to 3.
   * @param {boolean} scanByColumn - Whether to read column by column instead of row by row.
   * @returns {InternalScalarValue[]} The kept elements in scan order.
   */
  private collectFlattenElements(source: SimpleRangeValue, ignore: number, scanByColumn: boolean): InternalScalarValue[] {
    const ignoreBlanks = ignore === IGNORE_BLANKS || ignore === IGNORE_BLANKS_AND_ERRORS
    const ignoreErrors = ignore === IGNORE_ERRORS || ignore === IGNORE_BLANKS_AND_ERRORS
    const data = source.data
    const lineCount = scanByColumn ? source.width() : source.height()
    const lineLength = scanByColumn ? source.height() : source.width()
    const elements: InternalScalarValue[] = []

    for (let line = 0; line < lineCount; line++) {
      for (let position = 0; position < lineLength; position++) {
        const value = scanByColumn ? data[position][line] : data[line][position]
        const isIgnored = (ignoreBlanks && value === EmptyValue) || (ignoreErrors && value instanceof CellError)
        if (!isIgnored) {
          elements.push(value)
        }
      }
    }

    return elements
  }

  /**
   * Classifies a TOROW or TOCOL `ignore` expression for result-size
   * prediction. An omitted or empty `ignore` keeps every element; a literal
   * outside 0 to 3 after truncation is invalid.
   *
   * @param {Ast | undefined} argument - The `ignore` expression.
   * @returns {LiteralCount} The truncated value, an invalid-literal marker, or an unresolved marker.
   * @internal
   */
  private parseFlattenLiteralIgnore(argument: Ast | undefined): LiteralCount {
    if (argument === undefined || argument.type === AstNodeType.EMPTY) {
      return {kind: 'value', value: IGNORE_NOTHING}
    }

    const literal = this.parseLiteralCount(argument)
    if (literal.kind !== 'value') {
      return literal
    }

    const value = Math.trunc(literal.value)
    return value < IGNORE_NOTHING || value > IGNORE_BLANKS_AND_ERRORS ? {kind: 'invalid'} : {kind: 'value', value}
  }

  /**
   * Calculates the spilled array size of TOROW or TOCOL: one row or column
   * holding every source element. That is exact when `ignore` is 0 and the
   * upper bound otherwise, because `ignore` can only remove elements; the
   * cells a shorter result leaves unused stay blank. An invalid literal
   * `ignore` is reported as an invalid size, so the formula evaluates to its
   * #VALUE! error instead of reserving space. So is a source with no
   * elements, such as a whole column of an empty sheet, because an array
   * result cannot be reserved with no cells.
   *
   * A whole-column source of TOCOL (a whole-row source of TOROW) runs along
   * the result and is measured by its effective size. While blank cells may
   * be kept, such a result reaches the sheet edge, so it fits only in the
   * first row (column) and only from a single source column (row). Elsewhere
   * the dimension stays unbounded, which makes array-space validation report a
   * spill error. A formula below the first row would otherwise make its own
   * source taller when it spills, and a wider source would not fit the result.
   * The same rule applies whatever `ignore` is when the source is on the
   * formula's own sheet: a reservation longer than that sheet makes it grow,
   * and every new prediction would then reserve more. A computed source, such
   * as `A:A+0`, has no sheet to check and is measured by the configured sheet
   * limits, so it follows the same rule.
   *
   * @param {ProcedureAst} ast - The parsed TOROW or TOCOL call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @param {FlattenFunction} functionName - The function whose metadata and orientation apply.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  private flattenArraySize(ast: ProcedureAst, state: InterpreterState, functionName: FlattenFunction): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 3) {
      return ArraySize.error()
    }

    const ignore = this.parseFlattenLiteralIgnore(ast.args[1])
    if (ignore.kind === 'invalid') {
      return ArraySize.error()
    }

    const metadata = this.metadata(functionName)
    const sourceSize = this.arraySizeForAst(
      ast.args[0],
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)),
    )
    const effectiveSourceSize = this.effectiveSourceSize(ast.args[0], state)
    const height = Number.isFinite(sourceSize.height) ? sourceSize.height : effectiveSourceSize.height
    const width = Number.isFinite(sourceSize.width) ? sourceSize.width : effectiveSourceSize.width
    const toColumn = functionName === 'TOCOL'

    const mayKeepBlanks = ignore.kind === 'unresolved' || ignore.value === IGNORE_NOTHING || ignore.value === IGNORE_ERRORS
    const sourceRange = this.directSourceRange(ast.args[0], state)
    const isComputedOrOnFormulaSheet = sourceRange === undefined || sourceRange.sheet === state.formulaAddress.sheet
    const isUnboundedAlongResult = !Number.isFinite(toColumn ? sourceSize.height : sourceSize.width)
    if ((mayKeepBlanks || isComputedOrOnFormulaSheet) && isUnboundedAlongResult) {
      const sourceLinesAcross = toColumn ? width : height
      const anchor = toColumn ? state.formulaAddress.row : state.formulaAddress.col

      if (sourceLinesAcross > 1) {
        return new ArraySize(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
      }
      if (anchor !== 0) {
        return toColumn ? new ArraySize(1, Number.POSITIVE_INFINITY) : new ArraySize(Number.POSITIVE_INFINITY, 1)
      }
    }

    const length = height * width
    if (length < 1) {
      return ArraySize.error()
    }

    return toColumn ? new ArraySize(1, length) : new ArraySize(length, 1)
  }

  /**
   * Finishes the predicted size of a result that may span a whole column or
   * row. A spreadsheet result of that kind reaches the sheet edge, so it fits
   * only when it starts in the first row (column); elsewhere its unbounded
   * dimension is kept, so that array-space validation reports a spill error.
   * In the first row (column), or for a dimension the rule does not apply to,
   * an unbounded dimension is replaced by the source's effective size.
   *
   * @param {Ast} source - The source expression, measured when a dimension is unbounded.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @param {number} width - The predicted width, possibly unbounded.
   * @param {number} height - The predicted height, possibly unbounded.
   * @param {boolean} widthReachesSheetEdge - Whether an unbounded width must start in the first column.
   * @param {boolean} heightReachesSheetEdge - Whether an unbounded height must start in the first row.
   * @returns {ArraySize} The predicted size, an unbounded one that will not fit, or an invalid size when empty.
   * @internal
   */
  private sizeAtSheetEdge(
    source: Ast,
    state: InterpreterState,
    width: number,
    height: number,
    widthReachesSheetEdge: boolean,
    heightReachesSheetEdge: boolean,
  ): ArraySize {
    const startsBelowFirstRow = heightReachesSheetEdge && !Number.isFinite(height) && state.formulaAddress.row !== 0
    const startsRightOfFirstColumn = widthReachesSheetEdge && !Number.isFinite(width) && state.formulaAddress.col !== 0

    if (startsBelowFirstRow || startsRightOfFirstColumn) {
      return new ArraySize(width, height)
    }

    const effectiveSourceSize = this.effectiveSourceSize(source, state)
    const effectiveHeight = Number.isFinite(height) ? height : effectiveSourceSize.height
    const effectiveWidth = Number.isFinite(width) ? width : effectiveSourceSize.width

    if (effectiveHeight < 1 || effectiveWidth < 1) {
      return ArraySize.error()
    }

    // A fresh size: a reference's size would make the formula a single cell.
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
    if ((rows.kind === 'kept' || columns.kind === 'kept') && this.isUnpredictedExpandSize(ast.args[0], sourceSize)) {
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
   * line is padded with `pad_with`, or with #N/A when the `pad_with` argument
   * is omitted or left empty; a reference to an empty cell pads with blanks.
   * `wrap_count` is truncated toward zero. A two-dimensional vector or an
   * empty or blank one returns #VALUE!, a `wrap_count` below 1 returns #NUM!,
   * and a result larger than the configured sheet size (`maxRows`,
   * `maxColumns`) returns #VALUE!. Runs in time proportional to the vector's
   * length.
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
        const lineCount = Math.ceil(elements.length / lineLength)
        const [height, width] = functionName === 'WRAPROWS' ? [lineCount, lineLength] : [lineLength, lineCount]
        if (height > this.config.maxRows || width > this.config.maxColumns) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }
        const lines = Array.from({length: lineCount}, (_, line) =>
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
   * starts in the first row (column); otherwise the number of lines stays
   * unbounded, which makes array-space validation report a spill error. A result larger than the configured
   * sheet size is a single cell, so the formula evaluates to #VALUE!.
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
    const lineCount = Math.ceil(length / lineLength)
    const [height, width] = functionName === 'WRAPROWS' ? [lineCount, lineLength] : [lineLength, lineCount]
    if (height > this.config.maxRows || width > this.config.maxColumns) {
      return ArraySize.error()
    }

    const startsAwayFromSheetEdge = (!Number.isFinite(sourceSize.height) && state.formulaAddress.row !== 0)
      || (!Number.isFinite(sourceSize.width) && state.formulaAddress.col !== 0)
    if (!startsAwayFromSheetEdge) {
      return new ArraySize(width, height)
    }

    // The number of lines is unbounded. When the formula sits on the sheet edge that the line axis needs (column A
    // for WRAPCOLS, row 1 for WRAPROWS), the other axis is unbounded too, so that array-space validation reports a
    // spill error rather than reserving a partial result.
    return functionName === 'WRAPROWS'
      ? new ArraySize(state.formulaAddress.row === 0 ? Number.POSITIVE_INFINITY : lineLength, Number.POSITIVE_INFINITY)
      : new ArraySize(Number.POSITIVE_INFINITY, state.formulaAddress.col === 0 ? Number.POSITIVE_INFINITY : lineLength)
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
   * Coerces a WRAPROWS or WRAPCOLS `wrap_count`, an EXPAND `rows` or
   * `columns` value, or a TOROW or TOCOL `ignore` value, to a number
   * truncated toward zero. Errors are returned as they are; numeric text,
   * logical values and blank cells convert as for any number; empty text
   * returns #VALUE!.
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
  private isUnpredictedExpandSize(source: Ast, sourceSize: ArraySize): boolean {
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
   * Corresponds to TRIMRANGE(range, [trim_rows], [trim_cols]).
   *
   * Removes the blank rows and columns at the edges of the range and returns
   * the rest as values. Each code is 0 (trim nothing), 1 (leading blank lines),
   * 2 (trailing blank lines) or 3 (both, the default); any other value is a
   * #VALUE! error. A cell of a range is blank when it is empty: a formula is
   * content even when its value is blank. A source with nothing left to keep
   * returns a #REF! error.
   *
   * @param {ProcedureAst} ast - The parsed TRIMRANGE call.
   * @param {InterpreterState} state - The current formula evaluation state.
   * @returns {InterpreterValue} The trimmed source values or a spreadsheet error.
   */
  public trimrange(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    // An empty range argument would otherwise evaluate to a blank cell and be trimmed away.
    if (ast.args[0]?.type === AstNodeType.EMPTY) {
      return new CellError(ErrorType.VALUE, ErrorMessage.EmptyArg)
    }

    return this.runFunction(ast.args, state, this.metadata('TRIMRANGE'),
      (range: SimpleRangeValue, trimRows: InternalScalarValue, trimColumns: InternalScalarValue) => {
        // A spreadsheet lifts an array of codes into an array of results; a function returning an array cannot be
        // lifted here, so a code larger than one cell is an error.
        if (this.isMultiCellArgument(ast.args[1], state) || this.isMultiCellArgument(ast.args[2], state)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
        }

        const rowMode = this.coerceTrimCode(trimRows)
        if (rowMode instanceof CellError) {
          return rowMode
        }
        const columnMode = this.coerceTrimCode(trimColumns)
        if (columnMode instanceof CellError) {
          return columnMode
        }
        if (!this.isTrimMode(rowMode) || !this.isTrimMode(columnMode)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
        }

        const height = range.height()
        const width = range.width()
        const bounds = this.contentBounds(range, range.range ?? this.directSourceCell(ast.args[0], state))

        if (bounds === undefined) {
          return rowMode === 0 && columnMode === 0
            ? this.sliceSourceArray(range, 0, 0, height, width)
            : new CellError(ErrorType.REF, ErrorMessage.EmptyRange)
        }

        const top = (rowMode & TRIM_LEADING) !== 0 ? bounds.top : 0
        const bottom = (rowMode & TRIM_TRAILING) !== 0 ? bounds.bottom : height - 1
        const left = (columnMode & TRIM_LEADING) !== 0 ? bounds.left : 0
        const right = (columnMode & TRIM_TRAILING) !== 0 ? bounds.right : width - 1

        return this.sliceSourceArray(range, top, left, bottom - top + 1, right - left + 1)
      }
    )
  }

  /**
   * Calculates the spilled array size of TRIMRANGE. Which rows and columns are
   * blank is known only after evaluation, so the untrimmed source is reserved:
   * the result fills its top-left corner and the rest stays blank. A
   * whole-column or whole-row source follows the same sheet-edge rule as TAKE
   * (see `sizeAtSheetEdge`). A trim code that is certainly
   * invalid is reported as an invalid size, so the formula is a single error
   * cell instead of reserving space.
   *
   * @param {ProcedureAst} ast - The parsed TRIMRANGE call.
   * @param {InterpreterState} state - The formula state whose address anchors the spill.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public trimrangeArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 3) {
      return ArraySize.error()
    }

    if (
      !this.isPossibleTrimCode(ast.args[1])
      || !this.isPossibleTrimCode(ast.args[2])
      || this.isMultiCellArgument(ast.args[1], state)
      || this.isMultiCellArgument(ast.args[2], state)
    ) {
      return ArraySize.error()
    }

    const metadata = this.metadata('TRIMRANGE')
    const sourceSize = this.arraySizeForAst(
      ast.args[0],
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)),
    )

    if (sourceSize.isScalar() && !sourceSize.isRef) {
      return ArraySize.scalar()
    }

    return this.sizeAtSheetEdge(ast.args[0], state, sourceSize.width, sourceSize.height, true, true)
  }

  /**
   * Coerces a TRIMRANGE trim code to a number. An error is returned as it is,
   * and an empty text is a #VALUE! error rather than 0; numbers, numeric text,
   * booleans and blank cells coerce as numbers.
   *
   * @param {InternalScalarValue} value - The code as passed to the function.
   * @returns {number | CellError} The code as a number, not yet range-checked, or an error.
   */
  private coerceTrimCode(value: InternalScalarValue): number | CellError {
    if (value instanceof CellError) {
      return value
    }
    if (value === '') {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
    }
    const coercedValue = this.arithmeticHelper.coerceScalarToNumberOrError(value)
    return coercedValue instanceof CellError ? coercedValue : getRawValue(coercedValue)
  }

  /**
   * Checks that a number is a TRIMRANGE trim code: an integer from 0 to 3.
   * Fractions are rejected, not truncated.
   *
   * @param {number} value - The coerced code.
   * @returns {boolean} Whether the code is valid.
   */
  private isTrimMode(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= TRIM_BOTH
  }

  /**
   * Checks a TRIMRANGE trim code before evaluation. Omitted, empty and
   * unresolved codes may be valid; a literal is valid only when it is a trim
   * code, and an empty text never is.
   *
   * @param {Ast | undefined} argument - The code expression to inspect.
   * @returns {boolean} False when the code is certainly invalid.
   */
  private isPossibleTrimCode(argument: Ast | undefined): boolean {
    if (argument === undefined || argument.type === AstNodeType.EMPTY) {
      return true
    }
    if (argument.type === AstNodeType.STRING && argument.value === '') {
      return false
    }

    const code = this.parseLiteralCount(argument)
    if (code.kind === 'invalid') {
      return false
    }
    return code.kind === 'unresolved' || this.isTrimMode(code.value)
  }

  /**
   * Checks whether an argument is predicted to be larger than one cell: an
   * array constant, a multi-cell range or an array-returning function.
   *
   * @param {Ast | undefined} argument - The argument expression to inspect.
   * @param {InterpreterState} state - The formula state used to resolve relative addresses.
   * @returns {boolean} True when the argument is predicted to have more than one cell.
   */
  private isMultiCellArgument(argument: Ast | undefined, state: InterpreterState): boolean {
    if (argument === undefined || argument.type === AstNodeType.EMPTY) {
      return false
    }
    const size = this.arraySizeForAst(argument, new InterpreterState(state.formulaAddress, true))
    return size.width > 1 || size.height > 1
  }

  /**
   * Resolves a TRIMRANGE source written as a single cell reference to a
   * one-cell range, so that the cell is judged by its content like any cell of
   * a range. A single cell reference evaluates to its value, which carries no
   * range.
   *
   * @param {Ast | undefined} argument - The source expression to inspect.
   * @param {InterpreterState} state - The formula state used to resolve relative addresses.
   * @returns {AbsoluteCellRange | undefined} The one-cell range, or `undefined` for any other source.
   */
  private directSourceCell(argument: Ast | undefined, state: InterpreterState): AbsoluteCellRange | undefined {
    if (argument?.type === AstNodeType.PARENTHESIS) {
      return this.directSourceCell(argument.expression, state)
    }
    if (argument?.type !== AstNodeType.CELL_REFERENCE) {
      return undefined
    }
    return AbsoluteCellRange.spanFrom(argument.reference.toSimpleCellAddress(state.formulaAddress), 1, 1)
  }

  /**
   * Finds the rows and columns of a TRIMRANGE source that hold content. A
   * range is read cell by cell, only inside the part of it that lies within
   * its sheet's current height and width, since nothing beyond holds content.
   * A computed array is read element by element, a blank element being an
   * empty value. Both are scanned inward from the edges.
   *
   * @param {SimpleRangeValue} source - The evaluated source.
   * @param {AbsoluteCellRange | undefined} sourceRange - The cells the source was read from, or `undefined` for a computed array.
   * @returns {ContentBounds | undefined} The bounds relative to the source, or `undefined` when every cell is blank.
   */
  private contentBounds(source: SimpleRangeValue, sourceRange: AbsoluteCellRange | undefined): ContentBounds | undefined {
    if (sourceRange === undefined) {
      const data = source.data
      return this.scanContentBounds(data.length, source.width(), (row, column) => data[row][column] !== EmptyValue)
    }

    const address: SimpleCellAddress = {sheet: sourceRange.sheet, row: 0, col: 0}
    const height = Math.min(sourceRange.end.row, this.dependencyGraph.getSheetHeight(sourceRange.sheet) - 1) - sourceRange.start.row + 1
    const width = Math.min(sourceRange.end.col, this.dependencyGraph.getSheetWidth(sourceRange.sheet) - 1) - sourceRange.start.col + 1
    return this.scanContentBounds(height, width, (row, column) => {
      address.row = sourceRange.start.row + row
      address.col = sourceRange.start.col + column
      return this.isContentCell(address)
    })
  }

  /**
   * Scans a block inward from each edge for the first row and column that
   * hold content: rows from the top and the bottom, then columns from the left
   * and the right within those rows. The cost is the blank border plus one
   * line per edge, not the whole block, unless the block is blank.
   *
   * @param {number} height - The number of rows to scan; zero or less means none.
   * @param {number} width - The number of columns to scan; zero or less means none.
   * @param {(row: number, column: number) => boolean} hasContent - Whether the cell at a block position holds content.
   * @returns {ContentBounds | undefined} The bounds within the block, or `undefined` when every cell is blank.
   */
  private scanContentBounds(height: number, width: number, hasContent: (row: number, column: number) => boolean): ContentBounds | undefined {
    const rowHasContent = (row: number) => {
      for (let column = 0; column < width; column++) {
        if (hasContent(row, column)) {
          return true
        }
      }
      return false
    }
    const columnHasContent = (column: number, top: number, bottom: number) => {
      for (let row = top; row <= bottom; row++) {
        if (hasContent(row, column)) {
          return true
        }
      }
      return false
    }

    let top = 0
    while (top < height && !rowHasContent(top)) {
      top++
    }
    if (top >= height) {
      return undefined
    }
    let bottom = height - 1
    while (bottom > top && !rowHasContent(bottom)) {
      bottom--
    }
    let left = 0
    while (!columnHasContent(left, top, bottom)) {
      left++
    }
    let right = width - 1
    while (right > left && !columnHasContent(right, top, bottom)) {
      right--
    }

    return {top, bottom, left, right}
  }

  /**
   * Checks whether a cell holds content for TRIMRANGE. An empty cell is blank;
   * any formula is content, even one whose value is blank, including the cell
   * that holds an array formula; any other cell of a spilled array is content
   * when its value is not blank, so the blank padding of another array result
   * counts as blank.
   *
   * @param {SimpleCellAddress} address - The cell to inspect.
   * @returns {boolean} True when the cell holds content.
   */
  private isContentCell(address: SimpleCellAddress): boolean {
    const vertex = this.dependencyGraph.getCell(address)
    if (vertex === undefined || vertex instanceof EmptyCellVertex) {
      return false
    }
    if (vertex instanceof ArrayFormulaVertex) {
      const formulaAddress = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
      const holdsFormula = formulaAddress.sheet === address.sheet && formulaAddress.row === address.row && formulaAddress.col === address.col
      return holdsFormula || this.dependencyGraph.getCellValue(address) !== EmptyValue
    }
    return true
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
