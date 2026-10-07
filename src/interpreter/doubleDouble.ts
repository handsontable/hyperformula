/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * A number represented as the unevaluated sum `hi + lo` of two doubles (double-double arithmetic).
 * It carries about 106 bits of significand instead of 53, so sums and products keep the low-order
 * digits that plain doubles round away. After `twoSum`, `twoProduct`, `addDoubleDouble` and
 * `divideDoubleDouble`, `|lo|` is at most half an ulp of `hi`; products of double-doubles are left
 * unnormalized.
 *
 * Used where a result is the small difference of large accumulated quantities, such as a sum of
 * squared deviations. The building blocks are the error-free transformations TwoSum and TwoProduct
 * (splitting a factor by 2^27 + 1), which need no fused multiply-add.
 */
export interface DoubleDouble {
  readonly hi: number,
  readonly lo: number,
}

export const DOUBLE_DOUBLE_ZERO: DoubleDouble = {hi: 0, lo: 0}

/** Splitting constant for binary64: 2^27 + 1. */
const SPLITTER = 134217729

/** The largest magnitude that can be multiplied by `SPLITTER` without overflowing (2^996). */
const SPLIT_LIMIT = 2 ** 996

/**
 * The exact sum of two doubles, as a double-double (TwoSum).
 *
 * @param {number} a - first addend
 * @param {number} b - second addend
 * @returns {DoubleDouble} `a + b` with no rounding error
 */
export function twoSum(a: number, b: number): DoubleDouble {
  const hi = a + b
  const bVirtual = hi - a
  return {hi, lo: (a - (hi - bVirtual)) + (b - bVirtual)}
}

/**
 * The exact product of two doubles, as a double-double (TwoProduct).
 *
 * Factors up to 2^996 (about 6.7e299) are split and multiplied exactly. Larger factors are multiplied
 * directly, which keeps the result finite whenever the plain product is finite.
 *
 * @param {number} a - first factor
 * @param {number} b - second factor
 * @returns {DoubleDouble} `a * b`, with no rounding error unless a factor exceeds 2^996 or the product
 * overflows
 */
export function twoProduct(a: number, b: number): DoubleDouble {
  const hi = a * b
  if (Math.abs(a) > SPLIT_LIMIT || Math.abs(b) > SPLIT_LIMIT) {
    return {hi, lo: 0}
  }
  const aScaled = SPLITTER * a
  const aHigh = aScaled - (aScaled - a)
  const aLow = a - aHigh
  const bScaled = SPLITTER * b
  const bHigh = bScaled - (bScaled - b)
  const bLow = b - bHigh
  return {hi, lo: ((aHigh * bHigh - hi) + aHigh * bLow + aLow * bHigh) + aLow * bLow}
}

/**
 * Sum of two double-doubles.
 *
 * @param {DoubleDouble} x - first addend
 * @param {DoubleDouble} y - second addend
 * @returns {DoubleDouble} `x + y`; a sum that is infinite or NaN is the plain double sum
 */
export function addDoubleDouble(x: DoubleDouble, y: DoubleDouble): DoubleDouble {
  const sum = twoSum(x.hi, y.hi)
  if (!Number.isFinite(sum.hi)) {
    return {hi: sum.hi, lo: 0}
  }
  const lo = sum.lo + x.lo + y.lo
  const hi = sum.hi + lo
  return {hi, lo: lo - (hi - sum.hi)}
}

/**
 * Product of two double-doubles.
 *
 * @param {DoubleDouble} x - first factor
 * @param {DoubleDouble} y - second factor
 * @returns {DoubleDouble} `x * y`
 */
export function multiplyDoubleDouble(x: DoubleDouble, y: DoubleDouble): DoubleDouble {
  const product = twoProduct(x.hi, y.hi)
  return {hi: product.hi, lo: product.lo + x.hi * y.lo + x.lo * y.hi}
}

/**
 * Product of a double-double and a double.
 *
 * @param {DoubleDouble} x - double-double factor
 * @param {number} k - double factor
 * @returns {DoubleDouble} `x * k`
 */
export function scaleDoubleDouble(x: DoubleDouble, k: number): DoubleDouble {
  const product = twoProduct(x.hi, k)
  return {hi: product.hi, lo: product.lo + x.lo * k}
}

/**
 * Quotient of a double-double and a double.
 *
 * @param {DoubleDouble} x - dividend
 * @param {number} k - divisor
 * @returns {DoubleDouble} `x / k`
 */
export function divideDoubleDouble(x: DoubleDouble, k: number): DoubleDouble {
  const quotient = x.hi / k
  const product = twoProduct(quotient, k)
  return twoSum(quotient, ((x.hi - product.hi) - product.lo + x.lo) / k)
}

/**
 * Quotient of two double-doubles.
 *
 * A zero or non-finite divisor, or a non-finite quotient, gives the plain double quotient, so infinities,
 * zeros and NaNs are the same as in ordinary arithmetic.
 *
 * @param {DoubleDouble} x - dividend
 * @param {DoubleDouble} y - divisor
 * @returns {DoubleDouble} `x / y`
 */
export function divideDoubleDoubles(x: DoubleDouble, y: DoubleDouble): DoubleDouble {
  const quotient = x.hi / y.hi
  if (!Number.isFinite(quotient) || !Number.isFinite(y.hi)) {
    return {hi: quotient, lo: 0}
  }
  const remainder = addDoubleDouble(x, scaleDoubleDouble({hi: -y.hi, lo: -y.lo}, quotient))
  return twoSum(quotient, remainder.hi / y.hi)
}

/**
 * Rounds a double-double to the nearest double.
 *
 * @param {DoubleDouble} x - the value to round
 * @returns {number} `x` as a double
 */
export function roundDoubleDouble(x: DoubleDouble): number {
  return x.hi + x.lo
}
