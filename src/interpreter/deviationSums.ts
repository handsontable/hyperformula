/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  addDoubleDouble,
  divideDoubleDouble,
  DOUBLE_DOUBLE_ZERO,
  DoubleDouble,
  multiplyByPowerOfTwo,
  multiplyDoubleDouble,
  roundDoubleDouble,
  subtractDoubleDouble,
} from './doubleDouble'

/**
 * Sums of squared deviations and of products of deviations from the mean, for the functions built
 * on them (DEVSQ, COVARIANCE, SLOPE, STEYX, DSTDEV, DVAR and their variants).
 *
 * The mean, the deviations and their sums are all kept in double-double and rounded once at the end,
 * so the result is accurate to the last digits of the stored values even when the mean is large
 * relative to the spread.
 */

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
 * The deviations of the values from their mean.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @returns {DoubleDouble[]} `value - mean` for each value, without rounding
 */
export function deviationsFromMean(values: number[]): DoubleDouble[] {
  const center = mean(values)
  return values.map((value) => subtractDoubleDouble({hi: value, lo: 0}, center))
}

/**
 * The sum of the squared deviations of the values from their mean.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @returns {DoubleDouble} `sum((x - mean)^2)`
 */
export function sumOfSquaredDeviations(values: number[]): DoubleDouble {
  const deviations = deviationsFromMean(values)
  return sumOfProducts(deviations, deviations)
}

/**
 * The sum of the products of the paired deviations of two arrays from their means.
 *
 * @param {number[]} first - a non-empty array of numbers
 * @param {number[]} second - an array of the same length as `first`
 * @returns {DoubleDouble} `sum((x - mean(x)) * (y - mean(y)))`
 */
export function sumOfProductsOfDeviations(first: number[], second: number[]): DoubleDouble {
  return sumOfProducts(deviationsFromMean(first), deviationsFromMean(second))
}

/**
 * The variance of the values: the sum of squared deviations divided by `n - deltaDegreesOfFreedom`.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @param {number} deltaDegreesOfFreedom - 0 for the population variance, 1 for the sample variance
 * @returns {number} the variance, rounded once to a double
 */
export function variance(values: number[], deltaDegreesOfFreedom: number): number {
  return roundDoubleDouble(divideDoubleDouble(sumOfSquaredDeviations(values), values.length - deltaDegreesOfFreedom))
}

/**
 * The covariance of two arrays: the sum of products of deviations divided by `n - deltaDegreesOfFreedom`.
 *
 * @param {number[]} first - a non-empty array of numbers
 * @param {number[]} second - an array of the same length as `first`
 * @param {number} deltaDegreesOfFreedom - 0 for the population covariance, 1 for the sample covariance
 * @returns {number} the covariance, rounded once to a double
 */
export function covariance(first: number[], second: number[], deltaDegreesOfFreedom: number): number {
  return roundDoubleDouble(divideDoubleDouble(sumOfProductsOfDeviations(first, second), first.length - deltaDegreesOfFreedom))
}

/**
 * The sum of the products of paired double-doubles.
 *
 * @param {DoubleDouble[]} first - the first factors
 * @param {DoubleDouble[]} second - the second factors, of the same length
 * @returns {DoubleDouble} `sum(first[i] * second[i])`
 */
export function sumOfProducts(first: DoubleDouble[], second: DoubleDouble[]): DoubleDouble {
  return first.reduce<DoubleDouble>((sum, deviation, index) => addDoubleDouble(sum, multiplyDoubleDouble(deviation, second[index])), DOUBLE_DOUBLE_ZERO)
}
