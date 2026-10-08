/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Maybe} from '../../Maybe'
import {
  addDoubleDouble,
  divideDoubleDouble,
  DOUBLE_DOUBLE_ZERO,
  DoubleDouble,
  multiplyByPowerOfTwo,
  multiplyByTwoToThe,
  multiplyDoubleDouble,
  roundDoubleDouble,
  scaleDoubleDouble,
  subtractDoubleDouble,
  twoSum,
} from '../doubleDouble'

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
 * The smallest non-zero scaled difference of shifts that is added to an aggregate whose sum of squares
 * is 0 without lowering its exponent first (2^-450). Its square, at least 2^-900, is then computed
 * exactly (`twoProduct` is exact above 2^-969).
 */
const MIN_SCALED_SHIFT_DIFFERENCE = 2 ** -450

/**
 * The lowest exponent of an aggregate (-600). Scaled by `2^600`, even the smallest difference of two
 * doubles, 2^-1074, has a square above 2^-969, while `2^600` and `2^-600` are finite.
 */
const MIN_EXPONENT = -600

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
 * The exponent at which two shifts can be subtracted and their scaled difference squared: 0 when the
 * difference is within [`MIN_SCALED_SHIFT_DIFFERENCE`, `MAX_SCALED_SHIFT_DIFFERENCE`], higher when it
 * is larger, lower (down to `MIN_EXPONENT`) when it is smaller, and `-Infinity` when it is 0.
 *
 * @param {number} shift - the first shift
 * @param {number} otherShift - the second shift
 * @returns {number} the exponent
 */
function shiftDifferenceExponent(shift: number, otherShift: number): number {
  const difference = Math.abs(otherShift - shift)
  if (difference === 0) {
    return -Infinity
  }
  if (difference < MIN_SCALED_SHIFT_DIFFERENCE) {
    return Math.max(MIN_EXPONENT, Math.floor(Math.log2(difference)))
  }
  // halving the shifts first keeps their difference finite
  return exponentToFit(Math.abs(otherShift / 2 - shift / 2), MAX_SCALED_SHIFT_DIFFERENCE / 2)
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
 * The deviations are stored multiplied by `2^-exponent`, which is exact, so that the sums can neither
 * overflow nor underflow. The exponent is 0 until the scaled sum of squares exceeds
 * `MAX_SCALED_SUM_OF_SQUARES` (deviations of about 1e144 and above), and grows as needed. When all the
 * values so far are equal and the next one differs from them by less than `MIN_SCALED_SHIFT_DIFFERENCE`
 * (about 1e-135), the exponent is lowered instead, so that the squared difference does not underflow.
 * An aggregate whose sum of squares is 0 has exponent 0. The variance and the standard deviation are
 * computed at the scale of the sums and scaled back, so each is `#NUM!` only when it exceeds the
 * largest double, and 0 only when it is below the smallest one, whatever the order of the values.
 */
export class MomentsAggregate {

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
   * The moments of an array of numbers, added one by one in order, the same way as the values of a
   * range are folded for VAR.S, VAR.P, STDEV.S and STDEV.P, so that the results are the same.
   *
   * @param {number[]} values - the values
   * @returns {MomentsAggregate} an aggregate of the values
   */
  public static of(values: number[]): MomentsAggregate {
    return values.reduce((aggregate, value) => aggregate.compose(MomentsAggregate.single(value)), MomentsAggregate.empty)
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
   * difference of the shifts needs it). The exponent of an aggregate whose sum of squares is 0 does not
   * count, so the exponent is lowered when all the values are equal but for a tiny difference of the
   * shifts. An empty aggregate is the identity: composing with it returns the other aggregate
   * unchanged, with its own shift.
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
    if (other.exponent === this.exponent || other.count === 1) {
      const exponent = this.exponent
      const shiftDifference = exponent === 0
        ? twoSum(other.shift, -this.shift)
        : twoSum(other.shift * 2 ** -exponent, -this.shift * 2 ** -exponent)
      const magnitude = Math.abs(shiftDifference.hi)
      // a difference below MIN_SCALED_SHIFT_DIFFERENCE would lose precision when squared, which matters
      // only when it is not 0 and no non-zero sum of squares outweighs it; the exponent is then lowered
      const squaresPrecisely = magnitude >= MIN_SCALED_SHIFT_DIFFERENCE || magnitude === 0
        || this.shiftedSumOfSquares.hi !== 0 || other.shiftedSumOfSquares.hi !== 0
      if (magnitude <= MAX_SCALED_SHIFT_DIFFERENCE && squaresPrecisely) {
        return this.composeScaled(other, exponent, this.shiftedSum, this.shiftedSumOfSquares, other.shiftedSum, other.shiftedSumOfSquares, shiftDifference)
      }
    }

    // an aggregate whose sum of squares is 0 does not constrain the exponent
    const exponent = Math.max(
      this.shiftedSumOfSquares.hi === 0 ? -Infinity : this.exponent,
      other.shiftedSumOfSquares.hi === 0 ? -Infinity : other.exponent,
      shiftDifferenceExponent(this.shift, other.shift),
    )
    const thisScale = 2 ** (this.exponent - exponent)
    const otherScale = 2 ** (other.exponent - exponent)
    const scale = 2 ** -exponent
    return this.composeScaled(other, exponent,
      multiplyByPowerOfTwo(this.shiftedSum, thisScale),
      multiplyByPowerOfTwo(multiplyByPowerOfTwo(this.shiftedSumOfSquares, thisScale), thisScale),
      multiplyByPowerOfTwo(other.shiftedSum, otherScale),
      multiplyByPowerOfTwo(multiplyByPowerOfTwo(other.shiftedSumOfSquares, otherScale), otherScale),
      twoSum(other.shift * scale, -this.shift * scale),
    )
  }

  /**
   * The sample variance, as in VAR.S.
   *
   * @returns {Maybe<number>} the variance, or `undefined` for fewer than two values
   */
  public varSValue(): Maybe<number> {
    if (this.count > 1) {
      return this.variance(this.count - 1)
    } else {
      return undefined
    }
  }

  /**
   * The population variance, as in VAR.P.
   *
   * @returns {Maybe<number>} the variance, or `undefined` for no values
   */
  public varPValue(): Maybe<number> {
    if (this.count > 0) {
      return this.variance(this.count)
    } else {
      return undefined
    }
  }

  /**
   * The sample standard deviation, as in STDEV.S.
   *
   * @returns {Maybe<number>} the standard deviation, or `undefined` for fewer than two values
   */
  public stdevSValue(): Maybe<number> {
    if (this.count > 1) {
      return this.standardDeviation(this.count - 1)
    } else {
      return undefined
    }
  }

  /**
   * The population standard deviation, as in STDEV.P.
   *
   * @returns {Maybe<number>} the standard deviation, or `undefined` for no values
   */
  public stdevPValue(): Maybe<number> {
    if (this.count > 0) {
      return this.standardDeviation(this.count)
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
   * The variance: the sum of squared deviations from the mean divided by `divisor`.
   *
   * The scaled variance is multiplied by `2^(2 * exponent)` in two steps, so that the power of two
   * itself cannot overflow; the result overflows only when the variance exceeds the largest double.
   *
   * @param {number} divisor - `n - 1` for the sample variance, `n` for the population variance
   * @returns {number} the variance
   */
  private variance(divisor: number): number {
    return multiplyByTwoToThe(this.scaledVariance(divisor), 2 * this.exponent)
  }

  /**
   * The standard deviation: the square root of the variance, taken at the scale of the sums, so that
   * it is finite and non-zero whenever the exact standard deviation is, even when the variance is not.
   *
   * @param {number} divisor - `n - 1` for the sample standard deviation, `n` for the population one
   * @returns {number} the standard deviation
   */
  private standardDeviation(divisor: number): number {
    return Math.sqrt(this.scaledVariance(divisor)) * 2 ** this.exponent
  }

  /**
   * The sum of squared deviations from the mean at the scale of the sums, `S2 - S1^2 / n` with `S1`,
   * `S2` the shifted sums and `n` the count, divided by `divisor` and rounded once.
   *
   * `S1^2 / n` is evaluated as `S1 * (S1 / n)`, which cannot overflow because `S1^2 / n <= S2`.
   *
   * @param {number} divisor - `n - 1` for the sample variance, `n` for the population variance
   * @returns {number} the variance multiplied by `2^(-2 * exponent)`
   */
  private scaledVariance(divisor: number): number {
    const squaredSumOverCount = multiplyDoubleDouble(this.shiftedSum, divideDoubleDouble(this.shiftedSum, this.count))
    const sumOfSquaredDeviations = subtractDoubleDouble(this.shiftedSumOfSquares, squaredSumOverCount)
    return roundDoubleDouble(divideDoubleDouble(sumOfSquaredDeviations, divisor))
  }
}
