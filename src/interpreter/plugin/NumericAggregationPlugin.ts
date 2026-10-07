/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {SheetsNotEqual} from '../../errors'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, CellRangeAst, ProcedureAst} from '../../parser'
import {ColumnRangeAst, RowRangeAst} from '../../parser/Ast'
import {coerceBooleanToNumber} from '../ArithmeticHelper'
import {
  addDoubleDouble,
  divideDoubleDouble,
  DOUBLE_DOUBLE_ZERO,
  DoubleDouble,
  multiplyByPowerOfTwo,
  multiplyDoubleDouble,
  roundDoubleDouble,
  scaleDoubleDouble,
  subtractDoubleDouble,
  twoSum,
} from '../doubleDouble'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, ExtendedNumber, getRawValue, InternalScalarValue, isExtendedNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {AverageResult} from './AverageResult'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'
import {RangeVertex} from '../../DependencyGraph'

export type BinaryOperation<T> = (left: T, right: T) => T

export type MapOperation<T> = (arg: ExtendedNumber) => T

type coercionOperation = (arg: InternalScalarValue) => Maybe<ExtendedNumber | CellError>

function zeroForInfinite(value: InternalScalarValue) {
  if (isExtendedNumber(value) && !Number.isFinite(getRawValue(value))) {
    return 0
  } else {
    return value
  }
}

/**
 * The largest scaled sum of squared deviations a `MomentsAggregate` keeps (2^960). Above it, the
 * aggregate raises its exponent. Every scaled deviation is then at most 2^480, so rebasing the sums of
 * two aggregates cannot overflow.
 */
const MAX_SCALED_SUM_OF_SQUARES = 2 ** 960

/**
 * The largest scaled difference of shifts that two aggregates are rebased with (2^470). Above it, the
 * exponent is raised first.
 */
const MAX_SCALED_SHIFT_DIFFERENCE = 2 ** 470

/**
 * The smallest exponent `e >= 0` (up to one) for which `magnitude * 2^-e` is at most `limit`.
 *
 * @param {number} magnitude - a non-negative finite number
 * @param {number} limit - a positive power of two
 * @returns {number} the exponent
 */
function exponentToFit(magnitude: number, limit: number): number {
  return magnitude <= limit ? 0 : Math.ceil(Math.log2(magnitude / limit))
}

/**
 * Moments of a set of numbers, composable so that the value of a range can be cached and reused
 * for a larger range.
 *
 * Besides the count, it keeps the sums of deviations `S1` and of squared deviations `S2` from a
 * `shift`: the first value added. Both sums are double-double. Measured from a nearby value, the
 * deviations stay small, which avoids the cancellation of the textbook one-pass form
 * `sum(x^2) - sum(x)^2 / n` for data with a large mean and a small spread (for example 10000000.001,
 * 10000000.002, ...). The variance and the standard deviation are accurate to about one unit in the
 * last place of the exact values for the stored numbers. Double-double arithmetic does not guarantee
 * correct rounding.
 *
 * The deviations are stored multiplied by `2^-exponent`, which is exact, so that the sums cannot
 * overflow. The exponent is 0 until the scaled sum of squares exceeds `MAX_SCALED_SUM_OF_SQUARES`
 * (deviations of about 1e144 and above), and grows as needed. The variance is `#NUM!` only when it
 * exceeds the largest double, whatever the order of the values.
 */
class MomentsAggregate {

  public static empty = new MomentsAggregate(0, 0, 0, DOUBLE_DOUBLE_ZERO, DOUBLE_DOUBLE_ZERO)

  /**
   * @param {number} count - the number of values
   * @param {number} shift - the value the deviations are measured from
   * @param {number} exponent - the deviations are stored multiplied by `2^-exponent`
   * @param {DoubleDouble} shiftedSum - `S1`, the sum of `(x - shift) * 2^-exponent`
   * @param {DoubleDouble} shiftedSumOfSquares - `S2`, the sum of `((x - shift) * 2^-exponent)^2`
   */
  constructor(
    public readonly count: number,
    public readonly shift: number,
    public readonly exponent: number,
    public readonly shiftedSum: DoubleDouble,
    public readonly shiftedSumOfSquares: DoubleDouble,
  ) {
  }

  /**
   * The moments of one value, which is also the shift.
   *
   * @param {number} arg - the value
   * @returns {MomentsAggregate} an aggregate of the single value
   */
  public static single(arg: number): MomentsAggregate {
    return new MomentsAggregate(1, arg, 0, DOUBLE_DOUBLE_ZERO, DOUBLE_DOUBLE_ZERO)
  }

  /**
   * An aggregate whose exponent is raised, if needed, so that its scaled sum of squares is at most
   * `MAX_SCALED_SUM_OF_SQUARES`.
   *
   * @param {number} count - the number of values
   * @param {number} shift - the value the deviations are measured from
   * @param {number} exponent - the exponent of the given sums
   * @param {DoubleDouble} shiftedSum - the scaled sum of deviations
   * @param {DoubleDouble} shiftedSumOfSquares - the scaled sum of squared deviations
   * @returns {MomentsAggregate} the aggregate
   */
  private static normalized(count: number, shift: number, exponent: number, shiftedSum: DoubleDouble, shiftedSumOfSquares: DoubleDouble): MomentsAggregate {
    const excess = exponentToFit(Math.abs(shiftedSumOfSquares.hi), MAX_SCALED_SUM_OF_SQUARES)
    if (excess === 0) {
      return new MomentsAggregate(count, shift, exponent, shiftedSum, shiftedSumOfSquares)
    }
    const raise = Math.ceil(excess / 2)
    return new MomentsAggregate(count, shift, exponent + raise,
      multiplyByPowerOfTwo(shiftedSum, 2 ** -raise),
      multiplyByPowerOfTwo(shiftedSumOfSquares, 2 ** (-2 * raise)),
    )
  }

  /**
   * Combines two aggregates. The result keeps this aggregate's `shift`; the other one's shifted sums
   * are re-expressed relative to it, at the larger exponent of the two (raised further when the
   * difference of the shifts needs it). An empty aggregate is the identity: composing with it returns
   * the other aggregate unchanged, with its own shift.
   *
   * @param {MomentsAggregate} other - the aggregate to add
   * @returns {MomentsAggregate} the aggregate of the values of both
   */
  public compose(other: MomentsAggregate): MomentsAggregate {
    if (this.count === 0) {
      return other
    }
    if (other.count === 0) {
      return this
    }

    // the common case: no rescaling, because both aggregates have the same exponent or the other one
    // is a single value, whose shifted sums are 0 at any exponent
    if (other.exponent === this.exponent || (other.count === 1 && this.exponent > 0)) {
      const exponent = this.exponent
      const shiftDifference = exponent === 0
        ? twoSum(other.shift, -this.shift)
        : twoSum(other.shift * 2 ** -exponent, -this.shift * 2 ** -exponent)
      if (Math.abs(shiftDifference.hi) <= MAX_SCALED_SHIFT_DIFFERENCE) {
        return this.composeScaled(other, exponent, this.shiftedSum, this.shiftedSumOfSquares, other.shiftedSum, other.shiftedSumOfSquares, shiftDifference)
      }
    }

    // halving the shifts first keeps their difference finite
    const shiftDifferenceExponent = exponentToFit(Math.abs(other.shift / 2 - this.shift / 2), MAX_SCALED_SHIFT_DIFFERENCE / 2)
    const exponent = Math.max(this.exponent, other.exponent, shiftDifferenceExponent)
    const thisRaise = exponent - this.exponent
    const otherRaise = exponent - other.exponent
    const scale = 2 ** -exponent
    return this.composeScaled(other, exponent,
      multiplyByPowerOfTwo(this.shiftedSum, 2 ** -thisRaise),
      multiplyByPowerOfTwo(this.shiftedSumOfSquares, 2 ** (-2 * thisRaise)),
      multiplyByPowerOfTwo(other.shiftedSum, 2 ** -otherRaise),
      multiplyByPowerOfTwo(other.shiftedSumOfSquares, 2 ** (-2 * otherRaise)),
      twoSum(other.shift * scale, -this.shift * scale),
    )
  }

  public varSValue(): Maybe<number> {
    if (this.count > 1) {
      return this.variance(this.count - 1)
    } else {
      return undefined
    }
  }

  public varPValue(): Maybe<number> {
    if (this.count > 0) {
      return this.variance(this.count)
    } else {
      return undefined
    }
  }

  /**
   * Adds the other aggregate's sums, already scaled to `exponent`, to this aggregate's sums, also
   * scaled to `exponent`.
   *
   * @param {MomentsAggregate} other - the aggregate to add
   * @param {number} exponent - the common exponent
   * @param {DoubleDouble} shiftedSum - this aggregate's `S1` at `exponent`
   * @param {DoubleDouble} shiftedSumOfSquares - this aggregate's `S2` at `exponent`
   * @param {DoubleDouble} otherShiftedSum - the other aggregate's `S1` at `exponent`
   * @param {DoubleDouble} otherShiftedSumOfSquares - the other aggregate's `S2` at `exponent`
   * @param {DoubleDouble} shiftDifference - `(other.shift - this.shift) * 2^-exponent`
   * @returns {MomentsAggregate} the aggregate of the values of both
   */
  private composeScaled(
    other: MomentsAggregate,
    exponent: number,
    shiftedSum: DoubleDouble,
    shiftedSumOfSquares: DoubleDouble,
    otherShiftedSum: DoubleDouble,
    otherShiftedSumOfSquares: DoubleDouble,
    shiftDifference: DoubleDouble,
  ): MomentsAggregate {
    const count = this.count + other.count
    if (other.count === 1) {
      // the common case of adding one value: its deviation is the shift difference itself
      return MomentsAggregate.normalized(count, this.shift, exponent,
        addDoubleDouble(shiftedSum, shiftDifference),
        addDoubleDouble(shiftedSumOfSquares, multiplyDoubleDouble(shiftDifference, shiftDifference)),
      )
    }

    // other's sums rebased: S1 + n*d and S2 + 2*d*S1 + n*d^2
    const rebasedSum = addDoubleDouble(otherShiftedSum, scaleDoubleDouble(shiftDifference, other.count))
    const rebasedSumOfSquares = addDoubleDouble(
      addDoubleDouble(otherShiftedSumOfSquares, scaleDoubleDouble(multiplyDoubleDouble(shiftDifference, otherShiftedSum), 2)),
      scaleDoubleDouble(multiplyDoubleDouble(shiftDifference, shiftDifference), other.count),
    )
    return MomentsAggregate.normalized(count, this.shift, exponent,
      addDoubleDouble(shiftedSum, rebasedSum),
      addDoubleDouble(shiftedSumOfSquares, rebasedSumOfSquares),
    )
  }

  /**
   * The sum of squared deviations from the mean, `S2 - S1^2 / n` with `S1`, `S2` the shifted sums and
   * `n` the count, divided by `divisor` and rounded once.
   *
   * `S1^2 / n` is evaluated as `S1 * (S1 / n)`, which cannot overflow because `S1^2 / n <= S2`. The
   * quotient is computed at the scale of the sums and then multiplied by `2^(2 * exponent)` in two
   * steps, so that the power of two itself cannot overflow; the result overflows only when the
   * variance exceeds the largest double.
   *
   * @param {number} divisor - `n - 1` for the sample variance, `n` for the population variance
   * @returns {number} the variance
   */
  private variance(divisor: number): number {
    const squaredSumOverCount = multiplyDoubleDouble(this.shiftedSum, divideDoubleDouble(this.shiftedSum, this.count))
    const sumOfSquaredDeviations = subtractDoubleDouble(this.shiftedSumOfSquares, squaredSumOverCount)
    const scale = 2 ** this.exponent
    return roundDoubleDouble(divideDoubleDouble(sumOfSquaredDeviations, divisor)) * scale * scale
  }
}

export class NumericAggregationPlugin extends FunctionPlugin implements FunctionPluginTypecheck<NumericAggregationPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'SUM': {
      method: 'sum',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'SUMSQ': {
      method: 'sumsq',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'MAX': {
      method: 'max',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'MIN': {
      method: 'min',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'MAXA': {
      method: 'maxa',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'MINA': {
      method: 'mina',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'COUNT': {
      method: 'count',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'COUNTA': {
      method: 'counta',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'AVERAGE': {
      method: 'average',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'AVERAGEA': {
      method: 'averagea',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'PRODUCT': {
      method: 'product',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'VAR.S': {
      method: 'vars',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'VAR.P': {
      method: 'varp',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'VARA': {
      method: 'vara',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'VARPA': {
      method: 'varpa',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'STDEV.S': {
      method: 'stdevs',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'STDEV.P': {
      method: 'stdevp',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'STDEVA': {
      method: 'stdeva',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'STDEVPA': {
      method: 'stdevpa',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    },
    'SUBTOTAL': {
      method: 'subtotal',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.ANY}
      ],
      repeatLastArgs: 1,
    }
  }

  public static aliases = {
    VAR: 'VAR.S',
    VARP: 'VAR.P',
    STDEV: 'STDEV.S',
    STDEVP: 'STDEV.P',
    VARS: 'VAR.S',
    STDEVS: 'STDEV.S',
  }

  /**
   * Corresponds to SUM(Number1, Number2, ...).
   *
   * Returns a sum of given numbers.
   *
   * @param ast
   * @param state
   */
  public sum(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doSum(ast.args, state)
  }

  public sumsq(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.reduce(ast.args, state, 0, 'SUMSQ', this.addWithEpsilonRaw, (arg: ExtendedNumber) => Math.pow(getRawValue(arg), 2), strictlyNumbers)
  }

  /**
   * Corresponds to MAX(Number1, Number2, ...).
   *
   * Returns a max of given numbers.
   *
   * @param ast
   * @param state
   */
  public max(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doMax(ast.args, state)
  }

  public maxa(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const value = this.reduce(ast.args, state, Number.NEGATIVE_INFINITY, 'MAXA',
      (left: number, right: number) => Math.max(left, right),
      getRawValue, numbersBooleans)

    return zeroForInfinite(value)
  }

  /**
   * Corresponds to MIN(Number1, Number2, ...).
   *
   * Returns a min of given numbers.
   *
   * @param ast
   * @param state
   */
  public min(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doMin(ast.args, state)
  }

  public mina(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const value = this.reduce(ast.args, state, Number.POSITIVE_INFINITY, 'MINA',
      (left: number, right: number) => Math.min(left, right),
      getRawValue, numbersBooleans)

    return zeroForInfinite(value)
  }

  public count(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doCount(ast.args, state)
  }

  public counta(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doCounta(ast.args, state)
  }

  public average(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doAverage(ast.args, state)
  }

  public averagea(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.averageOf(ast.args, state, '_AVERAGE_A', numbersBooleans)
  }

  public vars(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doVarS(ast.args, state)
  }

  public varp(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doVarP(ast.args, state)
  }

  public vara(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, state)

    if (result instanceof CellError) {
      return result
    } else {
      return result.varSValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  public varpa(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, state)

    if (result instanceof CellError) {
      return result
    } else {
      return result.varPValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  public stdevs(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doStdevS(ast.args, state)
  }

  public stdevp(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doStdevP(ast.args, state)
  }

  public stdeva(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, state)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varSValue()
      return val === undefined ? new CellError(ErrorType.DIV_BY_ZERO) : Math.sqrt(val)
    }
  }

  public stdevpa(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregateA(ast.args, state)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varPValue()
      return val === undefined ? new CellError(ErrorType.DIV_BY_ZERO) : Math.sqrt(val)
    }
  }

  public product(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.doProduct(ast.args, state)
  }

  public subtotal(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    const functionType = this.coerceToType(this.evaluateAst(ast.args[0], state), {argumentType: FunctionArgumentType.NUMBER}, state)
    const args = ast.args.slice(1)
    switch (functionType) {
      case 1:
      case 101:
        return this.doAverage(args, state)
      case 2:
      case 102:
        return this.doCount(args, state)
      case 3:
      case 103:
        return this.doCounta(args, state)
      case 4:
      case 104:
        return this.doMax(args, state)
      case 5:
      case 105:
        return this.doMin(args, state)
      case 6:
      case 106:
        return this.doProduct(args, state)
      case 7:
      case 107:
        return this.doStdevS(args, state)
      case 8:
      case 108:
        return this.doStdevP(args, state)
      case 9:
      case 109:
        return this.doSum(args, state)
      case 10:
      case 110:
        return this.doVarS(args, state)
      case 11:
      case 111:
        return this.doVarP(args, state)
      default:
        return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
    }
  }

  private reduceAggregate(args: Ast[], state: InterpreterState): MomentsAggregate | CellError {
    return this.reduce<MomentsAggregate>(args, state, MomentsAggregate.empty, '_AGGREGATE', (left, right) => {
        return left.compose(right)
      }, (arg): MomentsAggregate => {
        return MomentsAggregate.single(getRawValue(arg))
      },
      strictlyNumbers
    )
  }

  private reduceAggregateA(args: Ast[], state: InterpreterState): MomentsAggregate | CellError {
    return this.reduce<MomentsAggregate>(args, state, MomentsAggregate.empty, '_AGGREGATE_A', (left, right) => {
        return left.compose(right)
      }, (arg): MomentsAggregate => {
        return MomentsAggregate.single(getRawValue(arg))
      },
      numbersBooleans
    )
  }

  private doAverage(args: Ast[], state: InterpreterState): InternalScalarValue {
    return this.averageOf(args, state, '_AVERAGE', strictlyNumbers)
  }

  /**
   * The plain sum of the values divided by their count, as in AVERAGE and AVERAGEA. The sum and the
   * count are folded in one pass and cached per range, so AVERAGE does not compute the variance sums.
   *
   * @param {Ast[]} args - the function arguments
   * @param {InterpreterState} state - interpreter state
   * @param {string} cacheKey - the range cache key
   * @param {coercionOperation} coercion - which values count
   * @returns {InternalScalarValue} the average, `#DIV/0!` when there are no values, or the first error
   */
  private averageOf(args: Ast[], state: InterpreterState, cacheKey: string, coercion: coercionOperation): InternalScalarValue {
    const result = this.reduce<AverageResult>(args, state, AverageResult.empty, cacheKey,
      (left, right) => left.compose(right),
      (arg) => AverageResult.single(getRawValue(arg)),
      coercion,
    )
    if (result instanceof CellError) {
      return result
    }
    return result.averageValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
  }

  private doVarS(args: Ast[], state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregate(args, state)

    if (result instanceof CellError) {
      return result
    } else {
      return result.varSValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  private doVarP(args: Ast[], state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregate(args, state)

    if (result instanceof CellError) {
      return result
    } else {
      return result.varPValue() ?? new CellError(ErrorType.DIV_BY_ZERO)
    }
  }

  private doStdevS(args: Ast[], state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregate(args, state)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varSValue()
      return val === undefined ? new CellError(ErrorType.DIV_BY_ZERO) : Math.sqrt(val)
    }
  }

  private doStdevP(args: Ast[], state: InterpreterState): InternalScalarValue {
    const result = this.reduceAggregate(args, state)

    if (result instanceof CellError) {
      return result
    } else {
      const val = result.varPValue()
      return val === undefined ? new CellError(ErrorType.DIV_BY_ZERO) : Math.sqrt(val)
    }
  }

  private doCount(args: Ast[], state: InterpreterState): InternalScalarValue {
    return this.reduce(args, state, 0, 'COUNT',
      (left: number, right: number) => left + right,
      getRawValue,
      (arg) => (isExtendedNumber(arg)) ? 1 : 0
    )
  }

  private doCounta(args: Ast[], state: InterpreterState): InternalScalarValue {
    return this.reduce(args, state, 0, 'COUNTA', (left: number, right: number) => left + right,
      getRawValue,
      (arg) => (arg === EmptyValue) ? 0 : 1
    )
  }

  private doMax(args: Ast[], state: InterpreterState): InternalScalarValue {
    const value = this.reduce(args, state, Number.NEGATIVE_INFINITY, 'MAX',
      (left: number, right: number) => Math.max(left, right),
      getRawValue, strictlyNumbers
    )

    return zeroForInfinite(value)
  }

  private doMin(args: Ast[], state: InterpreterState): InternalScalarValue {
    const value = this.reduce(args, state, Number.POSITIVE_INFINITY, 'MIN',
      (left: number, right: number) => Math.min(left, right),
      getRawValue, strictlyNumbers
    )

    return zeroForInfinite(value)
  }

  private doSum(args: Ast[], state: InterpreterState): InternalScalarValue {
    return this.reduce(args, state, 0, 'SUM', this.addWithEpsilonRaw, getRawValue, strictlyNumbers)
  }

  private doProduct(args: Ast[], state: InterpreterState): InternalScalarValue {
    return this.reduce(args, state, 1, 'PRODUCT', (left, right) => left * right, getRawValue, strictlyNumbers)
  }

  private addWithEpsilonRaw = (left: number, right: number) => this.arithmeticHelper.addWithEpsilonRaw(left, right)

  /**
   * Reduces procedure arguments with given reducing function
   *
   * @param args
   * @param state
   * @param initialAccValue - "neutral" value (equivalent of 0)
   * @param functionName - function name to use as cache key
   * @param reducingFunction - reducing function
   * @param mapFunction
   * @param coercionFunction
   */
  private reduce<T>(args: Ast[], state: InterpreterState, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): CellError | T {
    if (args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    return args.reduce((acc: T | CellError, arg) => {
      if (acc instanceof CellError) {
        return acc
      }

      if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
        const val = this.evaluateRange(arg, state, initialAccValue, functionName, reducingFunction, mapFunction, coercionFunction)
        if (val instanceof CellError) {
          return val
        }
        return reducingFunction(val, acc)
      }

      let value
      value = this.evaluateAst(arg, state)
      if (value instanceof SimpleRangeValue) {
        const coercedRangeValues = Array.from(value.valuesFromTopLeftCorner())
          .map(coercionFunction)
          .filter((arg) => (arg !== undefined)) as (CellError | number)[]

        return coercedRangeValues
          .map((arg) => {
            if (arg instanceof CellError) {
              return arg
            } else {
              return mapFunction(arg)
            }
          })
          .reduce((left, right) => {
            if (left instanceof CellError) {
              return left
            } else if (right instanceof CellError) {
              return right
            } else {
              return reducingFunction(left, right)
            }
          }, acc)
      } else if (arg.type === AstNodeType.CELL_REFERENCE) {
        value = coercionFunction(value)
        if (value === undefined) {
          return acc
        }
      } else {
        value = this.coerceScalarToNumberOrError(value)
        value = coercionFunction(value)
        if (value === undefined) {
          return acc
        }
      }

      if (value instanceof CellError) {
        return value
      }

      return reducingFunction(acc, mapFunction(value))
    }, initialAccValue)
  }

  /**
   * Performs range operation on given range
   *
   * @param {CellRangeAst | ColumnRangeAst | RowRangeAst} ast - cell range ast
   * @param {InterpreterState} state - interpreter state
   * @param {T} initialAccValue - initial accumulator value for reducing function
   * @param {string} functionName - function name to use as cache key
   * @param {BinaryOperation<T>} reducingFunction - reducing function
   * @param {MapOperation<T>} mapFunction - mapper transforming coerced scalar
   * @param {coercionOperation} coercionFunction - scalar-to-number coercer
   */
  private evaluateRange<T>(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, state: InterpreterState, initialAccValue: T, functionName: string, reducingFunction: BinaryOperation<T>, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): T | CellError {
    let range
    try {
      range = AbsoluteCellRange.fromAst(ast, state.formulaAddress)
    } catch (err) {
      if (err instanceof SheetsNotEqual) {
        return new CellError(ErrorType.REF, ErrorMessage.RangeManySheets)
      } else {
        throw err
      }
    }

    if (!this.isSheetValid(range)) {
      return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
    }

    const rangeVertex = this.dependencyGraph.getRange(range.start, range.end)

    if (rangeVertex === undefined) {
      throw new Error('Range does not exists in graph')
    }

    let value = rangeVertex.getFunctionValue(functionName) as (T | CellError | undefined)
    if (value === undefined) {
      const rangeValues = this.getRangeValues(functionName, range, rangeVertex, mapFunction, coercionFunction)
      value = rangeValues.reduce((arg1, arg2) => {
        if (arg1 instanceof CellError) {
          return arg1
        } else if (arg2 instanceof CellError) {
          return arg2
        } else {
          return reducingFunction(arg1, arg2)
        }
      }, initialAccValue)
      rangeVertex.setFunctionValue(functionName, value)
    }

    return value
  }

  /**
   * Checks whether both ends of a range point to existing sheets (placeholders excluded).
   */
  private isSheetValid(range: AbsoluteCellRange): boolean {
    return (
      this.dependencyGraph.sheetMapping.hasSheetWithId(range.start.sheet, {includePlaceholders: false}) &&
      this.dependencyGraph.sheetMapping.hasSheetWithId(range.end.sheet, {includePlaceholders: false})
    )
  }

  /**
   * Returns list of values for given range and function name
   *
   * If range is dependent on smaller range, list will contain value of smaller range for this function
   * and values of cells that are not present in smaller range
   *
   * @param functionName - function name (e.g., SUM)
   * @param range - cell range
   * @param rangeVertex
   * @param mapFunction
   * @param coercionFunction
   */
  private getRangeValues<T>(functionName: string, range: AbsoluteCellRange, rangeVertex: RangeVertex, mapFunction: MapOperation<T>, coercionFunction: coercionOperation): (T | CellError)[] {
    const rangeResult: (T | CellError)[] = []
    const {smallerRangeVertex, restRange} = this.dependencyGraph.rangeMapping.findSmallerRange(range)
    let actualRange: AbsoluteCellRange
    if (smallerRangeVertex !== undefined && this.dependencyGraph.existsEdge(smallerRangeVertex, rangeVertex)) {
      const cachedValue: Maybe<T> = smallerRangeVertex.getFunctionValue(functionName)
      if (cachedValue !== undefined) {
        rangeResult.push(cachedValue)
      } else {
        for (const cellFromRange of smallerRangeVertex.range.addresses(this.dependencyGraph)) {
          const val = coercionFunction(this.dependencyGraph.getScalarValue(cellFromRange))
          if (val instanceof CellError) {
            rangeResult.push(val)
          } else if (val !== undefined) {
            rangeResult.push(mapFunction(val))
          }
        }
      }
      actualRange = restRange
    } else {
      actualRange = range
    }

    for (const cellFromRange of actualRange.addresses(this.dependencyGraph)) {
      const val = coercionFunction(this.dependencyGraph.getScalarValue(cellFromRange))
      if (val instanceof CellError) {
        rangeResult.push(val)
      } else if (val !== undefined) {
        rangeResult.push(mapFunction(val))
      }
    }

    return rangeResult
  }
}

function strictlyNumbers(arg: InternalScalarValue): Maybe<CellError | ExtendedNumber> {
  if (isExtendedNumber(arg) || arg instanceof CellError) {
    return arg
  } else {
    return undefined
  }
}

function numbersBooleans(arg: InternalScalarValue): Maybe<CellError | ExtendedNumber> {
  if (typeof arg === 'boolean') {
    return coerceBooleanToNumber(arg)
  } else if (isExtendedNumber(arg) || arg instanceof CellError) {
    return arg
  } else if (typeof arg === 'string') {
    return 0
  } else {
    return undefined
  }
}
