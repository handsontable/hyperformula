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
 * The largest product magnitude for which the product of the split high halves (at most `|a * b|`
 * times (1 + 2^-26)^2) cannot overflow (2^1023).
 */
const PRODUCT_LIMIT = 2 ** 1023

/**
 * An exact power-of-two scale (2^53) for the larger factor of a product above `PRODUCT_LIMIT` or with
 * a factor above `SPLIT_LIMIT`, so that splitting it cannot overflow.
 */
const FACTOR_SCALE = 2 ** 53

/**
 * The largest dividend magnitude that `divideDoubleDouble` and `divideDoubleDoubles` divide directly
 * (2^1000). Above it, the quotient times the divisor can round to infinity, so the dividend is scaled
 * down by `DIVIDEND_SCALE` first.
 */
const DIVIDEND_LIMIT = 2 ** 1000

/** An exact power-of-two scale for dividends above `DIVIDEND_LIMIT` (2^64). */
const DIVIDEND_SCALE = 2 ** 64

/**
 * The exact sum of two doubles, as a double-double (TwoSum).
 *
 * The rounding error is computed from the addend of larger magnitude (Fast2Sum), which is exact and,
 * unlike the branch-free form, cannot overflow while the sum is finite.
 *
 * @param {number} a - first addend
 * @param {number} b - second addend
 * @returns {DoubleDouble} `a + b` with no rounding error
 */
export function twoSum(a: number, b: number): DoubleDouble {
  const hi = a + b
  return {hi, lo: Math.abs(a) >= Math.abs(b) ? b - (hi - a) : a - (hi - b)}
}

/**
 * The exact product of two doubles, as a double-double (TwoProduct).
 *
 * When a factor exceeds 2^996 or the product exceeds 2^1023, the larger factor is scaled by 2^-53
 * (exactly) so the splitting cannot overflow, and the error term is scaled back.
 *
 * @param {number} a - first factor
 * @param {number} b - second factor
 * @returns {DoubleDouble} `a * b`, with no rounding error whenever the product is finite and at least
 * 2^-969 in magnitude; an infinite or NaN product has `lo` 0
 */
export function twoProduct(a: number, b: number): DoubleDouble {
  const hi = a * b
  if (Math.abs(a) <= SPLIT_LIMIT && Math.abs(b) <= SPLIT_LIMIT && Math.abs(hi) <= PRODUCT_LIMIT) {
    return {hi, lo: productError(a, b, hi)}
  }
  if (!Number.isFinite(hi)) {
    return {hi, lo: 0}
  }
  const [larger, smaller] = Math.abs(a) >= Math.abs(b) ? [a, b] : [b, a]
  const largerScaled = larger / FACTOR_SCALE
  return {hi, lo: productError(largerScaled, smaller, largerScaled * smaller) * FACTOR_SCALE}
}

/**
 * The rounding error of `a * b`, where `hi` is `a * b` rounded (Dekker's product with Veltkamp
 * splitting). Exact when both factors are at most `SPLIT_LIMIT` and `|hi|` is at most `PRODUCT_LIMIT`.
 *
 * @param {number} a - first factor
 * @param {number} b - second factor
 * @param {number} hi - `a * b` rounded to a double
 * @returns {number} `a * b - hi`
 */
function productError(a: number, b: number, hi: number): number {
  const aScaled = SPLITTER * a
  const aHigh = aScaled - (aScaled - a)
  const aLow = a - aHigh
  const bScaled = SPLITTER * b
  const bHigh = bScaled - (bScaled - b)
  const bLow = b - bHigh
  return ((aHigh * bHigh - hi) + aHigh * bLow + aLow * bHigh) + aLow * bLow
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
 * Difference of two double-doubles.
 *
 * @param {DoubleDouble} x - minuend
 * @param {DoubleDouble} y - subtrahend
 * @returns {DoubleDouble} `x - y`; a difference that is infinite or NaN is the plain double difference
 */
export function subtractDoubleDouble(x: DoubleDouble, y: DoubleDouble): DoubleDouble {
  return addDoubleDouble(x, {hi: -y.hi, lo: -y.lo})
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
  if (Math.abs(x.hi) > DIVIDEND_LIMIT && Number.isFinite(x.hi)) {
    return multiplyByPowerOfTwo(divideDoubleDouble(multiplyByPowerOfTwo(x, 1 / DIVIDEND_SCALE), k), DIVIDEND_SCALE)
  }
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
  if (Math.abs(x.hi) > DIVIDEND_LIMIT) {
    return multiplyByPowerOfTwo(divideDoubleDoubles(multiplyByPowerOfTwo(x, 1 / DIVIDEND_SCALE), y), DIVIDEND_SCALE)
  }
  const remainder = subtractDoubleDouble(x, scaleDoubleDouble(y, quotient))
  return twoSum(quotient, remainder.hi / y.hi)
}

/**
 * Product of a double-double and a power of two, which is exact unless it overflows or underflows.
 *
 * @param {DoubleDouble} x - double-double factor
 * @param {number} powerOfTwo - a power of two
 * @returns {DoubleDouble} `x * powerOfTwo`
 */
export function multiplyByPowerOfTwo(x: DoubleDouble, powerOfTwo: number): DoubleDouble {
  return {hi: x.hi * powerOfTwo, lo: x.lo * powerOfTwo}
}

/**
 * Product of a double and `2^exponent`, for exponents beyond the range of a finite power of two.
 *
 * The power is applied in two halves of the same sign, so that neither half overflows or underflows
 * and an intermediate product overflows only when the result does. The product is exact unless it
 * overflows or is subnormal; a subnormal product can be rounded twice.
 *
 * @param {number} value - the double factor
 * @param {number} exponent - an integer, at most 2046 in magnitude
 * @returns {number} `value * 2^exponent`
 */
export function multiplyByTwoToThe(value: number, exponent: number): number {
  const half = Math.trunc(exponent / 2)
  return value * 2 ** half * 2 ** (exponent - half)
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
