/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  addDoubleDouble,
  divideDoubleDouble,
  divideDoubleDoubles,
  DOUBLE_DOUBLE_ZERO,
  DoubleDouble,
  multiplyByPowerOfTwo,
  multiplyByTwoToThe,
  multiplyDoubleDouble,
  roundDoubleDouble,
  subtractDoubleDouble,
} from './doubleDouble'

/**
 * Sums of squared deviations and of products of deviations from the mean, for the functions built
 * on them (DEVSQ, COVARIANCE, SLOPE and STEYX).
 *
 * The mean, the deviations and their sums are all kept in double-double and rounded once at the end,
 * so the result is accurate to the last digits of the stored values even when the mean is large
 * relative to the spread.
 *
 * Each array is measured at its own power-of-two scale, and the rounded results are scaled back, so
 * that a result is not lost to an intermediate sum that overflows or underflows:
 * - an array whose largest magnitude is below `MIN_UNSCALED_MAGNITUDE` is scaled up to it, which is
 * exact, so that its squared deviations cannot underflow;
 * - an array whose largest magnitude is above `MAX_UNSCALED_MAGNITUDE` is scaled down to it only when
 * the sums overflow without that. Scaling down rounds away the low-order bits of values about 2^1400
 * times smaller than the largest one, which matter when they pair with large deviations of the other
 * array, so it is used only where the sums could not be computed at all otherwise.
 */

/**
 * The binary exponent of the magnitudes that the arrays are scaled to (400).
 */
const SCALED_MAGNITUDE_EXPONENT = 400

/**
 * The smallest largest magnitude of an array that is used without scaling up (2^-400). Distinct
 * doubles near the largest magnitude differ by at least 2^-53 of it, so unless all the values are
 * equal, the largest deviation from their mean is at least about 2^-454 and its square, at least
 * 2^-908, is computed exactly (`twoProduct` is exact above 2^-969). So the sum of squared deviations
 * is 0 only when all the values are equal.
 */
const MIN_UNSCALED_MAGNITUDE = 2 ** -SCALED_MAGNITUDE_EXPONENT

/**
 * The largest magnitude of an array that is used without scaling down when the sums overflow (2^400).
 * Every deviation is then at most 2^402, and every product of two deviations at most 2^804, so no
 * sum can overflow.
 */
const MAX_UNSCALED_MAGNITUDE = 2 ** SCALED_MAGNITUDE_EXPONENT

/**
 * Deviations from the mean of an array of values, multiplied by `2^-exponent`.
 */
interface ScaledDeviations {
  /** `(value - mean) * 2^-exponent` for each value, without rounding */
  readonly deviations: DoubleDouble[],
  /** the exponent of the power of two the deviations are scaled by */
  readonly exponent: number,
}

/**
 * Sums of products of the deviations of two paired arrays, each array at its own scale.
 */
interface PairedSums {
  /** the sums, as returned by the function that computed them */
  readonly sums: DoubleDouble[],
  /** the deviations of the first array are multiplied by `2^-firstExponent` */
  readonly firstExponent: number,
  /** the deviations of the second array are multiplied by `2^-secondExponent` */
  readonly secondExponent: number,
}

/**
 * The sums a simple linear regression of `y` on `x` is computed from.
 */
export interface RegressionSums {
  /** `sum((x - mean(x))^2) * 2^(-2 * xExponent)` */
  readonly xSumOfSquares: DoubleDouble,
  /** `sum((x - mean(x)) * (y - mean(y))) * 2^(-xExponent - yExponent)` */
  readonly productsSum: DoubleDouble,
  /**
   * `sum((y - mean(y) - slope * (x - mean(x)))^2) * 2^(-2 * yExponent)`, the residual sum of squares,
   * when requested
   */
  readonly residualSumOfSquares: DoubleDouble,
  /** the exponent of the power of two the x deviations are scaled by */
  readonly xExponent: number,
  /** the exponent of the power of two the y deviations are scaled by */
  readonly yExponent: number,
}

/**
 * The sum of the squared deviations of the values from their mean.
 *
 * Only a tiny array is scaled: when the unscaled sum overflows, the sum itself exceeds the largest
 * double.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @returns {number} `sum((x - mean)^2)`, rounded once to a double
 */
export function sumOfSquaredDeviations(values: number[]): number {
  const {deviations, exponent} = scaledDeviationsFromMean(values, false)
  return multiplyByTwoToThe(roundDoubleDouble(sumOfProducts(deviations, deviations)), 2 * exponent)
}

/**
 * The covariance of two arrays: the sum of products of deviations divided by `n - deltaDegreesOfFreedom`.
 *
 * The quotient is rounded at the scale of the deviations and scaled back, so it is infinite only when
 * the covariance exceeds the largest double.
 *
 * @param {number[]} first - a non-empty array of numbers
 * @param {number[]} second - an array of the same length as `first`
 * @param {number} deltaDegreesOfFreedom - 0 for the population covariance, 1 for the sample covariance
 * @returns {number} the covariance, rounded once to a double
 */
export function covariance(first: number[], second: number[], deltaDegreesOfFreedom: number): number {
  const {sums: [productsSum], firstExponent, secondExponent} = pairedSums(first, second, (x, y) => [sumOfProducts(x, y)])
  const scaledCovariance = roundDoubleDouble(divideDoubleDouble(productsSum, first.length - deltaDegreesOfFreedom))
  return multiplyByTwoToThe(scaledCovariance, firstExponent + secondExponent)
}

/**
 * The sums of squared deviations and of products of deviations of a simple linear regression, each
 * array at its own scale.
 *
 * Unless all the x values are equal, the scaled sum of squares of x is at least about 2^-908, so the
 * scaled slope `productsSum / xSumOfSquares` is finite whenever the sum of squared y deviations is,
 * and so is every residual, whose square is at most the residual sum of squares.
 *
 * @param {number[]} knownYs - a non-empty array of the dependent values
 * @param {number[]} knownXs - an array of the independent values, of the same length as `knownYs`
 * @param {boolean} withResidualSumOfSquares - whether to compute `residualSumOfSquares`; otherwise it is 0
 * @returns {RegressionSums} the scaled sums and the exponents of the scales
 */
export function regressionSums(knownYs: number[], knownXs: number[], withResidualSumOfSquares: boolean): RegressionSums {
  const {sums: [xSumOfSquares, productsSum, residualSumOfSquares], firstExponent, secondExponent} = pairedSums(knownXs, knownYs,
    (x, y) => {
      const xSquaresSum = sumOfProducts(x, x)
      const xyProductsSum = sumOfProducts(y, x)
      return [xSquaresSum, xyProductsSum, withResidualSumOfSquares ? sumOfSquaredResiduals(y, x, xSquaresSum, xyProductsSum) : DOUBLE_DOUBLE_ZERO]
    },
  )
  return {xSumOfSquares, productsSum, residualSumOfSquares, xExponent: firstExponent, yExponent: secondExponent}
}

/**
 * The sum of squared residuals of a simple linear regression, from the deviations of y and x.
 *
 * The residuals are computed one by one rather than as `sum(dy^2) - productsSum^2 / xSumOfSquares`,
 * which cancels when the points lie almost on a line: each residual is then the small difference of
 * a deviation and its fitted value, which double-double keeps to about 2^-106 of the deviation.
 *
 * The rounding errors of the two means shift every residual by the same amount, the error of the y
 * mean minus the slope times the error of the x mean, which can exceed the residuals themselves when
 * the slope is large. The exact residuals sum to 0, so they are centered on their mean, which
 * removes that shift, before they are squared.
 *
 * @param {DoubleDouble[]} yDeviations - the deviations of y from its mean
 * @param {DoubleDouble[]} xDeviations - the deviations of x from its mean, at the same scale as the sums
 * @param {DoubleDouble} xSumOfSquares - `sum(dx^2)`
 * @param {DoubleDouble} productsSum - `sum(dy * dx)`
 * @returns {DoubleDouble} `sum((dy - slope * dx)^2)`, or 0 when all the x values are equal
 */
function sumOfSquaredResiduals(yDeviations: DoubleDouble[], xDeviations: DoubleDouble[], xSumOfSquares: DoubleDouble, productsSum: DoubleDouble): DoubleDouble {
  if (xSumOfSquares.hi === 0) {
    return DOUBLE_DOUBLE_ZERO
  }
  const slope = divideDoubleDoubles(productsSum, xSumOfSquares)
  const residuals = yDeviations.map((deviation, index) => subtractDoubleDouble(deviation, multiplyDoubleDouble(slope, xDeviations[index])))
  const residualsSum = residuals.reduce((total, residual) => addDoubleDouble(total, residual), DOUBLE_DOUBLE_ZERO)
  const residualsMean = divideDoubleDouble(residualsSum, residuals.length)
  const centeredResiduals = residuals.map((residual) => subtractDoubleDouble(residual, residualsMean))
  return sumOfProducts(centeredResiduals, centeredResiduals)
}

/**
 * Sums of products of the deviations of two paired arrays from their means.
 *
 * The sums are computed first with only tiny arrays scaled, which gives the same results as no scaling
 * at all for arrays of ordinary magnitude. Only when a sum is not finite, they are computed again with
 * the arrays whose largest magnitude exceeds `MAX_UNSCALED_MAGNITUDE` scaled down.
 *
 * @param {number[]} first - a non-empty array of numbers
 * @param {number[]} second - an array of the same length as `first`
 * @param {Function} computeSums - computes the sums from the scaled deviations of `first` and `second`
 * @returns {PairedSums} the scaled sums and the exponents of the scales
 */
function pairedSums(first: number[], second: number[], computeSums: (first: DoubleDouble[], second: DoubleDouble[]) => DoubleDouble[]): PairedSums {
  let firstDeviations = scaledDeviationsFromMean(first, false)
  let secondDeviations = scaledDeviationsFromMean(second, false)
  let sums = computeSums(firstDeviations.deviations, secondDeviations.deviations)
  if (sums.some((sum) => !Number.isFinite(sum.hi))) {
    firstDeviations = scaledDeviationsFromMean(first, true)
    secondDeviations = scaledDeviationsFromMean(second, true)
    sums = computeSums(firstDeviations.deviations, secondDeviations.deviations)
  }
  return {sums, firstExponent: firstDeviations.exponent, secondExponent: secondDeviations.exponent}
}

/**
 * The deviations of the values from their mean, measured at a power-of-two scale.
 *
 * The values are first multiplied by `2^-exponent`, which brings their largest magnitude up to
 * `MIN_UNSCALED_MAGNITUDE` when it is below it, and, when `scaleDown` is set, down to
 * `MAX_UNSCALED_MAGNITUDE` when it is above it. Scaling up is exact. Scaling down is exact except for
 * values that become subnormal, at least 2^1400 times smaller than the largest one.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @param {boolean} scaleDown - whether to scale down values above `MAX_UNSCALED_MAGNITUDE`
 * @returns {ScaledDeviations} the scaled deviations, without rounding, and the exponent of the scale
 */
function scaledDeviationsFromMean(values: number[], scaleDown: boolean): ScaledDeviations {
  const exponent = scalingExponent(largestMagnitude(values), scaleDown)
  const scale = 2 ** -exponent
  const scaledValues = exponent === 0 ? values : values.map((value) => value * scale)
  const center = mean(scaledValues)
  return {
    deviations: scaledValues.map((value) => subtractDoubleDouble({hi: value, lo: 0}, center)),
    exponent,
  }
}

/**
 * The exponent `scaledDeviationsFromMean` scales the values by.
 *
 * @param {number} magnitude - the largest magnitude of the values
 * @param {boolean} scaleDown - whether to scale down magnitudes above `MAX_UNSCALED_MAGNITUDE`
 * @returns {number} an exponent between -674 and 624: 0 when the values are not scaled, otherwise the
 * binary exponent of `magnitude` minus that of the magnitude it is scaled to
 */
function scalingExponent(magnitude: number, scaleDown: boolean): number {
  if (magnitude > 0 && magnitude < MIN_UNSCALED_MAGNITUDE) {
    return Math.floor(Math.log2(magnitude)) + SCALED_MAGNITUDE_EXPONENT
  }
  if (scaleDown && magnitude > MAX_UNSCALED_MAGNITUDE && Number.isFinite(magnitude)) {
    return Math.floor(Math.log2(magnitude)) - SCALED_MAGNITUDE_EXPONENT
  }
  return 0
}

/**
 * The largest absolute value of the values.
 *
 * A plain loop, which is several times faster than `reduce` with `Math.max` on long arrays.
 *
 * @param {number[]} values - an array of numbers
 * @returns {number} the largest `|value|`, or 0 for an empty array
 */
function largestMagnitude(values: number[]): number {
  let largest = 0
  for (const value of values) {
    const magnitude = Math.abs(value)
    if (magnitude > largest) {
      largest = magnitude
    }
  }
  return largest
}

/**
 * The mean of the values.
 *
 * When the running total overflows, the values are summed scaled down by a power of two no smaller
 * than their count, so that no partial sum can exceed the largest double, and the mean is scaled back.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @returns {DoubleDouble} the mean, without rounding to a double
 */
function mean(values: number[]): DoubleDouble {
  const total = sum(values)
  if (Number.isFinite(total.hi)) {
    return divideDoubleDouble(total, values.length)
  }
  const scale = 2 ** Math.ceil(Math.log2(values.length))
  const scaledTotal = sum(values.map((value) => value / scale))
  return multiplyByPowerOfTwo(divideDoubleDouble(scaledTotal, values.length), scale)
}

/**
 * The sum of the values.
 *
 * @param {number[]} values - an array of numbers
 * @returns {DoubleDouble} the sum, without rounding to a double
 */
function sum(values: number[]): DoubleDouble {
  return values.reduce<DoubleDouble>((total, value) => addDoubleDouble(total, {hi: value, lo: 0}), DOUBLE_DOUBLE_ZERO)
}

/**
 * The sum of the products of paired double-doubles.
 *
 * @param {DoubleDouble[]} first - the first factors
 * @param {DoubleDouble[]} second - the second factors, of the same length
 * @returns {DoubleDouble} `sum(first[i] * second[i])`
 */
function sumOfProducts(first: DoubleDouble[], second: DoubleDouble[]): DoubleDouble {
  return first.reduce<DoubleDouble>((sum, deviation, index) => addDoubleDouble(sum, multiplyDoubleDouble(deviation, second[index])), DOUBLE_DOUBLE_ZERO)
}
