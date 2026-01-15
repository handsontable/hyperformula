/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Rounding modes supported by numeric implementations.
 * These follow the IEEE 754 rounding modes.
 */
export enum RoundingMode {
  /** Round away from zero */
  ROUND_UP = 0,
  /** Round towards zero (truncate) */
  ROUND_DOWN = 1,
  /** Round towards positive infinity */
  ROUND_CEIL = 2,
  /** Round towards negative infinity */
  ROUND_FLOOR = 3,
  /** Round to nearest, ties away from zero (standard rounding) */
  ROUND_HALF_UP = 4,
  /** Round to nearest, ties towards zero */
  ROUND_HALF_DOWN = 5,
  /** Round to nearest, ties to even (banker's rounding) */
  ROUND_HALF_EVEN = 6,
  /** Round to nearest, ties towards positive infinity */
  ROUND_HALF_CEIL = 7,
  /** Round to nearest, ties towards negative infinity */
  ROUND_HALF_FLOOR = 8,
}

/**
 * Configuration options for numeric implementations.
 */
export interface NumericConfig {
  /** Number of significant digits (default: 34 for decimal.js) */
  precision?: number,
  /** Default rounding mode */
  rounding?: RoundingMode,
  /** Minimum exponent for exponential notation (default: -18) */
  minExponent?: number,
  /** Maximum exponent for exponential notation (default: 18) */
  maxExponent?: number,
}

/**
 * Abstract interface for numeric values.
 *
 * This interface allows HyperFormula to use different numeric
 * implementations (decimal.js, native numbers, etc.) without
 * modifying the core calculation logic.
 *
 * All implementations must be immutable - operations return new instances.
 *
 * @example
 * ```typescript
 * // Using the default decimal.js implementation
 * const factory = new DecimalNumericFactory()
 * const a = factory.create('0.1')
 * const b = factory.create('0.2')
 * const result = a.plus(b) // 0.3 (exact)
 * ```
 */
export interface Numeric {
  // ============ ARITHMETIC OPERATIONS ============

  /**
   * Returns a new Numeric whose value is this plus `other`.
   * @param other The number to add
   */
  plus(other: Numeric): Numeric,

  /**
   * Returns a new Numeric whose value is this minus `other`.
   * @param other The number to subtract
   */
  minus(other: Numeric): Numeric,

  /**
   * Returns a new Numeric whose value is this times `other`.
   * @param other The number to multiply by
   */
  times(other: Numeric): Numeric,

  /**
   * Returns a new Numeric whose value is this divided by `other`.
   * @param other The divisor
   */
  dividedBy(other: Numeric): Numeric,

  /**
   * Returns a new Numeric whose value is this raised to `exponent`.
   * @param exponent The exponent (can be Numeric or number)
   */
  pow(exponent: Numeric | number): Numeric,

  /**
   * Returns the square root of this number.
   */
  sqrt(): Numeric,

  /**
   * Returns the absolute value of this number.
   */
  abs(): Numeric,

  /**
   * Returns the negation of this number (-this).
   */
  neg(): Numeric,

  /**
   * Returns the modulo (remainder) of this divided by `other`.
   * @param other The divisor
   */
  mod(other: Numeric): Numeric,

  // ============ MATHEMATICAL FUNCTIONS ============

  /**
   * Returns the natural logarithm (base e) of this number.
   */
  ln(): Numeric,

  /**
   * Returns the base-10 logarithm of this number.
   */
  log10(): Numeric,

  /**
   * Returns e raised to the power of this number.
   */
  exp(): Numeric,

  /**
   * Returns the sine of this number (in radians).
   */
  sin(): Numeric,

  /**
   * Returns the cosine of this number (in radians).
   */
  cos(): Numeric,

  /**
   * Returns the tangent of this number (in radians).
   */
  tan(): Numeric,

  /**
   * Returns the arc sine (inverse sine) of this number.
   */
  asin(): Numeric,

  /**
   * Returns the arc cosine (inverse cosine) of this number.
   */
  acos(): Numeric,

  /**
   * Returns the arc tangent (inverse tangent) of this number.
   */
  atan(): Numeric,

  /**
   * Returns the hyperbolic sine of this number.
   */
  sinh(): Numeric,

  /**
   * Returns the hyperbolic cosine of this number.
   */
  cosh(): Numeric,

  /**
   * Returns the hyperbolic tangent of this number.
   */
  tanh(): Numeric,

  /**
   * Returns the inverse hyperbolic sine of this number.
   */
  asinh(): Numeric,

  /**
   * Returns the inverse hyperbolic cosine of this number.
   */
  acosh(): Numeric,

  /**
   * Returns the inverse hyperbolic tangent of this number.
   */
  atanh(): Numeric,

  // ============ ROUNDING OPERATIONS ============

  /**
   * Returns this number rounded down to the nearest integer.
   */
  floor(): Numeric,

  /**
   * Returns this number rounded up to the nearest integer.
   */
  ceil(): Numeric,

  /**
   * Returns this number rounded to the nearest integer.
   */
  round(): Numeric,

  /**
   * Returns this number truncated to an integer (towards zero).
   */
  trunc(): Numeric,

  /**
   * Returns this number rounded to `decimalPlaces` decimal places.
   * @param decimalPlaces Number of decimal places
   * @param roundingMode Optional rounding mode (default: ROUND_HALF_UP)
   */
  toDecimalPlaces(decimalPlaces: number, roundingMode?: RoundingMode): Numeric,

  /**
   * Returns this number rounded to `significantDigits` significant digits.
   * @param significantDigits Number of significant digits
   * @param roundingMode Optional rounding mode
   */
  toSignificantDigits(
    significantDigits: number,
    roundingMode?: RoundingMode,
  ): Numeric,

  // ============ COMPARISON OPERATIONS ============

  /**
   * Compares this number to `other`.
   * @returns -1 if this < other, 0 if equal, 1 if this > other, NaN if either is NaN
   */
  comparedTo(other: Numeric): number,

  /**
   * Returns true if this number equals `other`.
   */
  equals(other: Numeric): boolean,

  /**
   * Returns true if this number is greater than `other`.
   */
  greaterThan(other: Numeric): boolean,

  /**
   * Returns true if this number is greater than or equal to `other`.
   */
  greaterThanOrEqualTo(other: Numeric): boolean,

  /**
   * Returns true if this number is less than `other`.
   */
  lessThan(other: Numeric): boolean,

  /**
   * Returns true if this number is less than or equal to `other`.
   */
  lessThanOrEqualTo(other: Numeric): boolean,

  // ============ PREDICATES ============

  /**
   * Returns true if this number is zero.
   */
  isZero(): boolean,

  /**
   * Returns true if this number is negative.
   */
  isNegative(): boolean,

  /**
   * Returns true if this number is positive.
   */
  isPositive(): boolean,

  /**
   * Returns true if this number is an integer.
   */
  isInteger(): boolean,

  /**
   * Returns true if this number is finite (not Infinity or NaN).
   */
  isFinite(): boolean,

  /**
   * Returns true if this number is NaN.
   */
  isNaN(): boolean,

  // ============ CONVERSION OPERATIONS ============

  /**
   * Converts this number to a JavaScript number.
   * WARNING: May lose precision for large or very precise numbers!
   */
  toNumber(): number,

  /**
   * Returns a string representation of this number.
   */
  toString(): string,

  /**
   * Returns a string representation with fixed decimal places.
   * @param decimalPlaces Number of decimal places (optional)
   */
  toFixed(decimalPlaces?: number): string,

  /**
   * Returns a string representation in exponential notation.
   * @param decimalPlaces Number of decimal places (optional)
   */
  toExponential(decimalPlaces?: number): string,

  /**
   * Returns the primitive value (for JavaScript operators).
   * This returns the number value for compatibility.
   */
  valueOf(): number,

  // ============ INTERNAL ACCESS ============

  /**
   * Returns the internal representation value.
   * Used for debugging and serialization.
   */
  getInternalValue(): unknown,
}

/**
 * Factory interface for creating Numeric instances.
 *
 * Each implementation (decimal.js, native numbers, etc.) provides its own factory.
 * This allows HyperFormula to be configured with different numeric
 * implementations at runtime.
 *
 * @example
 * ```typescript
 * // Using decimal.js (default, highest precision)
 * const factory = new DecimalNumericFactory({ precision: 34 })
 *
 * // Using native numbers (faster, standard JS precision)
 * const factory = new NativeNumericFactory()
 *
 * // Custom implementation
 * class MyFactory implements NumericFactory { ... }
 * ```
 */
export interface NumericFactory {
  /**
   * Creates a new Numeric from the given value.
   * @param value Number, string, or another Numeric
   */
  create(value: number | string | Numeric): Numeric,

  /**
   * Returns a Numeric representing zero.
   */
  zero(): Numeric,

  /**
   * Returns a Numeric representing one.
   */
  one(): Numeric,

  /**
   * Creates a Numeric from a JavaScript number.
   * @param n The number value
   */
  fromNumber(n: number): Numeric,

  /**
   * Creates a Numeric from a string.
   * @param s The string representation
   */
  fromString(s: string): Numeric,

  /**
   * Returns PI (3.14159...) with full precision.
   */
  PI(): Numeric,

  /**
   * Returns Euler's number e (2.71828...) with full precision.
   */
  E(): Numeric,

  /**
   * Returns positive infinity.
   */
  POSITIVE_INFINITY(): Numeric,

  /**
   * Returns negative infinity.
   */
  NEGATIVE_INFINITY(): Numeric,

  /**
   * Returns NaN (Not a Number).
   */
  NaN(): Numeric,

  /**
   * Configures the factory with the given options.
   * @param options Configuration options
   */
  configure(options: NumericConfig): void,

  /**
   * Returns the current configuration.
   */
  getConfig(): NumericConfig,

  /**
   * Returns the name of this implementation (e.g., 'decimal.js', 'native').
   */
  getName(): string,
}

/**
 * Type guard to check if a value implements Numeric.
 */
export function isNumeric(value: unknown): value is Numeric {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Numeric).plus === 'function' &&
    typeof (value as Numeric).minus === 'function' &&
    typeof (value as Numeric).times === 'function' &&
    typeof (value as Numeric).dividedBy === 'function' &&
    typeof (value as Numeric).toNumber === 'function'
  )
}
