/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  addDoubleDouble,
  divideDoubleDouble,
  DOUBLE_DOUBLE_ZERO,
  DoubleDouble,
  multiplyDoubleDouble,
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
 * @param {number[]} values - a non-empty array of numbers
 * @returns {DoubleDouble} the mean, without rounding to a double
 */
function mean(values: number[]): DoubleDouble {
  const total = values.reduce<DoubleDouble>((sum, value) => addDoubleDouble(sum, {hi: value, lo: 0}), DOUBLE_DOUBLE_ZERO)
  return divideDoubleDouble(total, values.length)
}

/**
 * The deviations of the values from their mean.
 *
 * @param {number[]} values - a non-empty array of numbers
 * @returns {DoubleDouble[]} `value - mean` for each value, without rounding
 */
function deviationsFromMean(values: number[]): DoubleDouble[] {
  const center = mean(values)
  return values.map((value) => addDoubleDouble({hi: value, lo: 0}, {hi: -center.hi, lo: -center.lo}))
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
 * The sum of the products of paired double-doubles.
 *
 * @param {DoubleDouble[]} first - the first factors
 * @param {DoubleDouble[]} second - the second factors, of the same length
 * @returns {DoubleDouble} `sum(first[i] * second[i])`
 */
function sumOfProducts(first: DoubleDouble[], second: DoubleDouble[]): DoubleDouble {
  return first.reduce<DoubleDouble>((sum, deviation, index) => addDoubleDouble(sum, multiplyDoubleDouble(deviation, second[index])), DOUBLE_DOUBLE_ZERO)
}
