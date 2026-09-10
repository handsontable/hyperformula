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
  predictors: number,
  orientation: 'paired' | 'columns' | 'rows',
}

/** Classifies the original dimensions before any values are flattened. */
function regressionShape(y: ArraySize, x?: ArraySize): RegressionShape | undefined {
  if (x === undefined || (y.width === x.width && y.height === x.height)) {
    return {predictors: 1, orientation: 'paired'}
  }
  if (y.width === 1 && y.height === x.height) {
    return {predictors: x.width, orientation: 'columns'}
  }
  if (y.height === 1 && y.width === x.width) {
    return {predictors: x.height, orientation: 'rows'}
  }
  return undefined
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
        if (shape.predictors + 1 > this.config.maxColumns) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }
        if (this.linestArraySize(ast, state).width !== shape.predictors + 1) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LinestStaticSize)
        }
        const yValues = Array.from(knownY.valuesFromTopLeftCorner())
        const xValues = x === undefined ? yValues.map((_, i) => i + 1) : Array.from(x.valuesFromTopLeftCorner())
        if (!yValues.every(isExtendedNumber) || !xValues.every(isExtendedNumber)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
        }
        const observations = yValues.map(getRawValue) as number[]
        const numericX = xValues.map(getRawValue) as number[]
        const predictors = observations.map((_, i) => {
          if (shape.orientation === 'paired') {
            return [numericX[i]]
          }
          return Array.from({length: shape.predictors}, (_, j) => numericX[shape.orientation === 'columns' ? i * shape.predictors + j : j * observations.length + i])
        })
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
    if (shape === undefined || shape.predictors + 1 > this.config.maxColumns) {
      return ArraySize.error()
    }
    return new ArraySize(shape.predictors + 1, statistics ? 5 : 1)
  }
}
