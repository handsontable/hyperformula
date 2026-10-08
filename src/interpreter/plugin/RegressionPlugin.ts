/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {coerceScalarToBoolean, coerceToRange} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, getRawValue, InternalScalarValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'
import {fitLinearRegression, LinearRegressionResult} from './regression/LinearRegression'

/** The orientation and predictor count shared by size prediction and runtime validation. */
interface RegressionShape {
  predictorCount: number,
  orientation: 'paired' | 'columns' | 'rows',
}

/** Classifies the original dimensions before any values are flattened. */
function regressionShape(y: ArraySize, x?: ArraySize): RegressionShape | undefined {
  if (x === undefined || (y.width === x.width && y.height === x.height)) {
    return {predictorCount: 1, orientation: 'paired'}
  }
  if (y.width === 1 && y.height === x.height) {
    return {predictorCount: x.width, orientation: 'columns'}
  }
  if (y.height === 1 && y.width === x.width) {
    return {predictorCount: x.height, orientation: 'rows'}
  }
  return undefined
}

/**
 * Converts validated, flattened predictor values into one row per observation.
 * In columns orientation, each source row is an observation; in rows orientation,
 * each source row is a predictor. Paired ranges supply one predictor per observation.
 */
function buildPredictorRows(predictorValues: number[], observationCount: number, shape: RegressionShape): number[][] {
  return Array.from({length: observationCount}, (_, observationIndex) => {
    if (shape.orientation === 'paired') {
      return [predictorValues[observationIndex]]
    }
    return Array.from({length: shape.predictorCount}, (_, predictorIndex) => {
      let flatIndex: number
      if (shape.orientation === 'columns') {
        flatIndex = observationIndex * shape.predictorCount + predictorIndex
      } else {
        flatIndex = predictorIndex * observationCount + observationIndex
      }
      return predictorValues[flatIndex]
    })
  })
}

/** LINEST rejects empty strings as Boolean options, including formula-generated strings. */
function regressionBoolean(value: InternalScalarValue): boolean | CellError | undefined {
  return value === '' ? undefined : coerceScalarToBoolean(value)
}

/** Recognizes a numeric literal with optional parentheses and unary signs. */
function isNumericConstant(ast: Ast): boolean {
  if (ast.type === AstNodeType.PARENTHESIS) {
    return isNumericConstant(ast.expression)
  }
  if (ast.type === AstNodeType.PLUS_UNARY_OP || ast.type === AstNodeType.MINUS_UNARY_OP) {
    return isNumericConstant(ast.value)
  }
  return ast.type === AstNodeType.NUMBER
}

/** Resolves scalar constants without evaluating dependencies during array-size prediction. */
function staticBoolean(ast: Ast | undefined): boolean | undefined {
  if (ast === undefined || ast.type === AstNodeType.EMPTY) {
    return false
  }
  if (ast.type === AstNodeType.PARENTHESIS) {
    return staticBoolean(ast.expression)
  }
  if (ast.type === AstNodeType.NUMBER || ast.type === AstNodeType.STRING) {
    const value = regressionBoolean(ast.value)
    return typeof value === 'boolean' ? value : undefined
  }
  if (ast.type === AstNodeType.PLUS_UNARY_OP || ast.type === AstNodeType.MINUS_UNARY_OP) {
    return isNumericConstant(ast.value) ? staticBoolean(ast.value) : undefined
  }
  if (ast.type === AstNodeType.FUNCTION_CALL && ast.args.length === 0) {
    if (ast.procedureName === 'TRUE') {
      return true
    }
    if (ast.procedureName === 'FALSE') {
      return false
    }
  }
  return undefined
}

/** Converts numerical failures to spreadsheet errors, including inside an array result. */
function finiteValue(value: number): number | CellError {
  return Number.isFinite(value) ? value : new CellError(ErrorType.NUM, ErrorMessage.NaN)
}

/** Formats the five-row result while preserving statistics errors independently of coefficients. */
function regressionOutput(fit: LinearRegressionResult, statistics: boolean, fitIntercept: boolean): SimpleRangeValue {
  const result: InternalScalarValue[][] = [[...fit.coefficients].reverse().concat(fit.intercept).map(finiteValue)]
  if (!statistics) {
    return SimpleRangeValue.onlyValues(result)
  }
  const regressionSumSquares = fit.totalSumSquares - fit.residualSumSquares
  const variance = fit.degreesOfFreedom === 0 ? 0 : fit.residualSumSquares / fit.degreesOfFreedom
  const rSquared = fit.totalSumSquares === 0 ? 1 : regressionSumSquares / fit.totalSumSquares
  const f = finiteValue((regressionSumSquares / fit.retainedPredictorCount) / variance)
  const interceptError = fitIntercept ? finiteValue(fit.interceptError) : new CellError(ErrorType.NA)
  result.push([...fit.standardErrors].reverse().map(finiteValue).concat(interceptError))
  result.push([finiteValue(rSquared), finiteValue(Math.sqrt(variance))])
  result.push([f, fit.degreesOfFreedom])
  result.push([finiteValue(regressionSumSquares), finiteValue(fit.residualSumSquares)])
  for (const row of result) {
    while (row.length < fit.coefficients.length + 1) {
      row.push(new CellError(ErrorType.NA))
    }
  }
  return SimpleRangeValue.onlyValues(result)
}

/** The validated values of a regression: one observation and one predictor row per data point. */
interface RegressionData {
  observations: number[],
  predictors: number[][],
}

/** Tells whether an optional argument was left out or passed empty, as in `TREND(y,,new_x)`. */
function isOmittedArgument(ast: ProcedureAst, index: number): boolean {
  return ast.args.length <= index || ast.args[index].type === AstNodeType.EMPTY
}

/**
 * Reads the `const` or `stats` option of TREND, GROWTH and LOGEST as Excel does: a blank cell is FALSE, numbers and
 * booleans are coerced, and text (also numeric text and an empty string) is #VALUE!. An error read from a cell
 * reference is #VALUE!; any other error, such as `NA()` written in the formula, is returned as is.
 */
function regressionOption(value: InternalScalarValue, ast: Ast | undefined): boolean | CellError {
  if (value instanceof CellError) {
    return ast?.type === AstNodeType.CELL_REFERENCE ? new CellError(ErrorType.VALUE, ErrorMessage.WrongType) : value
  }
  const option = typeof value === 'string' ? undefined : coerceScalarToBoolean(value)
  return typeof option === 'boolean' ? option : new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
}

/**
 * Checks that every known value is a number and arranges the predictors one row per observation.
 * Omitted `known_x` values are 1, 2, 3, … in the order of `known_y`.
 */
function regressionData(knownY: SimpleRangeValue, knownX: SimpleRangeValue | undefined, shape: RegressionShape): RegressionData | CellError {
  const yValues = Array.from(knownY.valuesFromTopLeftCorner())
  const xValues = knownX === undefined ? yValues.map((_, i) => i + 1) : Array.from(knownX.valuesFromTopLeftCorner())
  if (!yValues.every(isExtendedNumber) || !xValues.every(isExtendedNumber)) {
    return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
  }
  const observations = yValues.map(getRawValue)
  return {observations, predictors: buildPredictorRows(xValues.map(getRawValue), observations.length, shape)}
}

/**
 * Returns the size of a TREND or GROWTH result for `new_x` values of the given size, or undefined when `new_x`
 * does not have one column (columns orientation) or one row (rows orientation) per predictor.
 * One predictor: one value per `new_x` cell, in the shape of `new_x`.
 */
function predictionSize(shape: RegressionShape, newX: ArraySize): ArraySize | undefined {
  if (shape.orientation === 'paired') {
    return new ArraySize(newX.width, newX.height)
  }
  if (shape.orientation === 'columns') {
    return newX.width === shape.predictorCount ? new ArraySize(1, newX.height) : undefined
  }
  return newX.height === shape.predictorCount ? new ArraySize(newX.width, 1) : undefined
}

/** Arranges `new_x` values one predictor row per predicted point, in the result's row-major order. */
function buildNewPointRows(newXValues: number[], newX: ArraySize, shape: RegressionShape): number[][] {
  if (shape.orientation === 'paired') {
    return newXValues.map(value => [value])
  }
  if (shape.orientation === 'columns') {
    return Array.from({length: newX.height}, (_, row) => newXValues.slice(row * newX.width, (row + 1) * newX.width))
  }
  return Array.from({length: newX.width}, (_, column) =>
    Array.from({length: newX.height}, (_, row) => newXValues[row * newX.width + column]))
}

/** Evaluates the fitted line b + m1·x1 + … + mk·xk at one point. */
function linearPrediction(fit: LinearRegressionResult, point: number[]): number {
  return point.reduce((sum, value, i) => sum + fit.coefficients[i] * value, fit.intercept)
}

/**
 * Evaluates the fitted exponential curve b · m1^x1 · … · mk^xk at one point, where b and m are the exponentials of
 * the coefficients fitted to ln y. Excel's product form is kept: it overflows and underflows where Excel does.
 */
function exponentialPrediction(fit: LinearRegressionResult, point: number[]): number {
  return point.reduce((product, value, i) => product * Math.exp(fit.coefficients[i]) ** value, Math.exp(fit.intercept))
}

/** Implements linear regression with statically predictable result dimensions. */
export class RegressionPlugin extends FunctionPlugin implements FunctionPluginTypecheck<RegressionPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'LINEST': {
      method: 'linest',
      sizeOfResultArrayMethod: 'linestArraySize',
      vectorizationForbidden: true,
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.ANY, defaultValue: EmptyValue},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: true, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: false, emptyAsDefault: true},
      ],
    },
    'LOGEST': {
      method: 'logest',
      // LOGEST shares LINEST's size method because both return the same coefficient and statistics layout.
      sizeOfResultArrayMethod: 'linestArraySize',
      vectorizationForbidden: true,
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.ANY, defaultValue: EmptyValue},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: true, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: false, emptyAsDefault: true},
      ],
    },
    'TREND': {
      method: 'trend',
      sizeOfResultArrayMethod: 'trendArraySize',
      vectorizationForbidden: true,
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.ANY, defaultValue: EmptyValue},
        {argumentType: FunctionArgumentType.ANY, defaultValue: EmptyValue},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: true, emptyAsDefault: true},
      ],
    },
    'GROWTH': {
      method: 'growth',
      sizeOfResultArrayMethod: 'trendArraySize',
      vectorizationForbidden: true,
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.ANY, defaultValue: EmptyValue},
        {argumentType: FunctionArgumentType.ANY, defaultValue: EmptyValue},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: true, emptyAsDefault: true},
      ],
    },
  }

  /**
   * Evaluates LINEST(known_y, [known_x], [const], [stats]).
   * Returns coefficients in reverse predictor order, followed by the intercept.
   * With stats enabled, adds standard errors; R-squared and residual standard error;
   * F and residual degrees of freedom; regression and residual sums of squares.
   * Unused statistics cells and the intercept standard error for const=FALSE are #N/A.
   *
   * A dynamic stats option is rejected here as well as during size prediction so that
   * nested consumers cannot accidentally bypass the fixed-size contract.
   */
  public linest(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const generatedX = ast.args.length < 2 || ast.args[1].type === AstNodeType.EMPTY
    return this.runFunction(ast.args, state, this.metadata('LINEST'),
      (knownY: SimpleRangeValue, knownX: InterpreterValue, constArg: InternalScalarValue, statsArg: InternalScalarValue) => {
        const fitIntercept = regressionBoolean(constArg)
        const statistics = regressionBoolean(statsArg)
        if (fitIntercept instanceof CellError) {
          return fitIntercept
        }
        if (statistics instanceof CellError) {
          return statistics
        }
        if (fitIntercept === undefined || statistics === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
        }
        if (staticBoolean(ast.args[3]) === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LinestStaticStats)
        }
        const x = generatedX ? undefined : coerceToRange(knownX)
        const shape = regressionShape(knownY.size, x?.size)
        if (shape === undefined) {
          return new CellError(ErrorType.REF, ErrorMessage.ArrayDimensions)
        }
        if (shape.predictorCount + 1 > this.config.maxColumns) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }
        if (this.linestArraySize(ast, state).width !== shape.predictorCount + 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LinestStaticSize)
        }
        const yValues = Array.from(knownY.valuesFromTopLeftCorner())
        const xValues = x === undefined ? yValues.map((_, i) => i + 1) : Array.from(x.valuesFromTopLeftCorner())
        if (!yValues.every(isExtendedNumber) || !xValues.every(isExtendedNumber)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
        }
        const observations = yValues.map(getRawValue)
        const numericX = xValues.map(getRawValue)
        const predictors = buildPredictorRows(numericX, observations.length, shape)
        const fit = fitLinearRegression(predictors, observations, fitIntercept, statistics)
        return regressionOutput(fit, statistics, fitIntercept)
      })
  }

  /** Predicts output width from predictor geometry and height from a constant stats option. */
  public linestArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 4) {
      return ArraySize.error()
    }
    const statistics = staticBoolean(ast.args[3])
    if (statistics === undefined) {
      return ArraySize.error()
    }
    const arrayState = new InterpreterState(state.formulaAddress, true)
    const y = this.arraySizeForAst(ast.args[0], arrayState)
    const x = ast.args.length < 2 || ast.args[1].type === AstNodeType.EMPTY ? undefined : this.arraySizeForAst(ast.args[1], arrayState)
    const shape = regressionShape(y, x)
    if (shape === undefined || shape.predictorCount + 1 > this.config.maxColumns) {
      return ArraySize.error()
    }
    return new ArraySize(shape.predictorCount + 1, statistics ? 5 : 1)
  }

  /**
   * Evaluates LOGEST(known_y, [known_x], [const], [stats]): LINEST fitted to ln y, with the first row
   * exponentiated into the bases m1 … mk and the constant b of y = b · m1^x1 · … · mk^xk.
   * The statistics rows are LINEST's statistics of the ln y fit. As in LINEST, `stats` must be a constant.
   */
  public logest(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOGEST'),
      (knownY: SimpleRangeValue, knownXArg: InterpreterValue, constArg: InternalScalarValue, statsArg: InternalScalarValue) => {
        const fitIntercept = regressionOption(constArg, ast.args[2])
        if (fitIntercept instanceof CellError) {
          return fitIntercept
        }
        const statistics = regressionOption(statsArg, ast.args[3])
        if (statistics instanceof CellError) {
          return statistics
        }
        if (staticBoolean(ast.args[3]) === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.StaticStats('LOGEST'))
        }
        const knownX = isOmittedArgument(ast, 1) ? undefined : coerceToRange(knownXArg)
        const shape = regressionShape(knownY.size, knownX?.size)
        if (shape === undefined) {
          return new CellError(ErrorType.REF, ErrorMessage.ArrayDimensions)
        }
        if (shape.predictorCount + 1 > this.config.maxColumns) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }
        if (this.linestArraySize(ast, state).width !== shape.predictorCount + 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.StaticResultSize('LOGEST'))
        }
        const data = regressionData(knownY, knownX, shape)
        if (data instanceof CellError) {
          return data
        }
        if (data.observations.some(value => value <= 0)) {
          return new CellError(ErrorType.NUM, ErrorMessage.PositiveValues)
        }
        const fit = fitLinearRegression(data.predictors, data.observations.map(Math.log), fitIntercept, statistics)
        const exponentiated = {...fit, coefficients: fit.coefficients.map(Math.exp), intercept: Math.exp(fit.intercept)}
        return regressionOutput(exponentiated, statistics, fitIntercept)
      })
  }

  /**
   * Evaluates TREND(known_y, [known_x], [new_x], [const]): the values of the least-squares line at `new_x`,
   * or at `known_x` when `new_x` is omitted.
   */
  public trend(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TREND'),
      (knownY: SimpleRangeValue, knownX: InterpreterValue, newX: InterpreterValue, constArg: InternalScalarValue) =>
        this.predict(ast, state, 'TREND', knownY, knownX, newX, constArg))
  }

  /**
   * Evaluates GROWTH(known_y, [known_x], [new_x], [const]): the values of the exponential curve fitted to `known_y`
   * at `new_x`, or at `known_x` when `new_x` is omitted. Every `known_y` value must be positive.
   */
  public growth(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GROWTH'),
      (knownY: SimpleRangeValue, knownX: InterpreterValue, newX: InterpreterValue, constArg: InternalScalarValue) =>
        this.predict(ast, state, 'GROWTH', knownY, knownX, newX, constArg))
  }

  /**
   * Predicts the result size of TREND and GROWTH: the size of `known_y` when `new_x` is omitted, otherwise one value
   * per `new_x` point (see `predictionSize`).
   */
  public trendArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 4) {
      return ArraySize.error()
    }
    const arrayState = new InterpreterState(state.formulaAddress, true)
    const y = this.arraySizeForAst(ast.args[0], arrayState)
    const x = isOmittedArgument(ast, 1) ? undefined : this.arraySizeForAst(ast.args[1], arrayState)
    const shape = regressionShape(y, x)
    if (shape === undefined) {
      return ArraySize.error()
    }
    if (isOmittedArgument(ast, 2)) {
      return new ArraySize(y.width, y.height)
    }
    return predictionSize(shape, this.arraySizeForAst(ast.args[2], arrayState)) ?? ArraySize.error()
  }

  /**
   * Shared body of TREND and GROWTH. Errors follow Excel's precedence: a bad `const`, then incompatible
   * dimensions (#REF!), then non-numeric values (#VALUE!), then (GROWTH) a non-positive `known_y` (#NUM!).
   * GROWTH fits ln y and evaluates the exponential curve. O(n·k² + m·k) for n observations, k predictors
   * and m predicted points.
   */
  private predict(
    ast: ProcedureAst,
    state: InterpreterState,
    functionName: 'TREND' | 'GROWTH',
    knownY: SimpleRangeValue,
    knownXArg: InterpreterValue,
    newXArg: InterpreterValue,
    constArg: InternalScalarValue,
  ): InterpreterValue {
    const fitIntercept = regressionOption(constArg, ast.args[3])
    if (fitIntercept instanceof CellError) {
      return fitIntercept
    }
    const knownX = isOmittedArgument(ast, 1) ? undefined : coerceToRange(knownXArg)
    const newX = isOmittedArgument(ast, 2) ? undefined : coerceToRange(newXArg)
    const shape = regressionShape(knownY.size, knownX?.size)
    if (shape === undefined) {
      return new CellError(ErrorType.REF, ErrorMessage.ArrayDimensions)
    }
    const resultSize = newX === undefined ? knownY.size : predictionSize(shape, newX.size)
    if (resultSize === undefined) {
      return new CellError(ErrorType.REF, ErrorMessage.ArrayDimensions)
    }
    const data = regressionData(knownY, knownX, shape)
    if (data instanceof CellError) {
      return data
    }
    const newXValues = newX === undefined ? [] : Array.from(newX.valuesFromTopLeftCorner())
    if (!newXValues.every(isExtendedNumber)) {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
    }
    const exponential = functionName === 'GROWTH'
    if (exponential && data.observations.some(value => value <= 0)) {
      return new CellError(ErrorType.NUM, ErrorMessage.PositiveValues)
    }
    const predictedSize = this.trendArraySize(ast, state)
    if (predictedSize.width !== resultSize.width || predictedSize.height !== resultSize.height) {
      return new CellError(ErrorType.VALUE, ErrorMessage.StaticResultSize(functionName))
    }
    const fit = fitLinearRegression(data.predictors, exponential ? data.observations.map(Math.log) : data.observations, fitIntercept, false)
    const points = newX === undefined ? data.predictors : buildNewPointRows(newXValues.map(getRawValue), newX.size, shape)
    const values = points.map(point => finiteValue(exponential ? exponentialPrediction(fit, point) : linearPrediction(fit, point)))
    return SimpleRangeValue.onlyValues(Array.from({length: resultSize.height}, (_, row) =>
      values.slice(row * resultSize.width, (row + 1) * resultSize.width)))
  }
}
