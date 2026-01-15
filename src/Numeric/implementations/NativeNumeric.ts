/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  Numeric,
  NumericFactory,
  NumericConfig,
  RoundingMode
} from '../Numeric'

/**
 * Implementation of Numeric using native JavaScript numbers.
 * 
 * This implementation provides standard IEEE-754 float64 behavior,
 * which is the default JavaScript number type. Use this for:
 * - Backward compatibility with existing behavior
 * - Maximum performance (no library overhead)
 * - Non-financial calculations where precision loss is acceptable
 * 
 * WARNING: This implementation has the same precision issues as
 * standard JavaScript numbers:
 * - 0.1 + 0.2 !== 0.3
 * - Limited to ~15-17 significant digits
 * - Cannot represent all decimal fractions exactly
 * 
 * For financial calculations, use DecimalNumericFactory instead.
 */
export class NativeNumeric implements Numeric {
  /**
   * Creates a new NativeNumeric wrapping a JavaScript number.
   * @param {number} value The native JavaScript number value
   */
  constructor(private readonly value: number) {}

  // ============ ARITHMETIC OPERATIONS ============
  /**
   *
   */
  plus(other: Numeric): Numeric {
    return new NativeNumeric(this.value + other.toNumber())
  }
  /**
   *
   */
  minus(other: Numeric): Numeric {
    return new NativeNumeric(this.value - other.toNumber())
  }
  /**
   *
   */
  times(other: Numeric): Numeric {
    return new NativeNumeric(this.value * other.toNumber())
  }
  /**
   *
   */
  dividedBy(other: Numeric): Numeric {
    return new NativeNumeric(this.value / other.toNumber())
  }
  /**
   *
   */
  pow(exponent: Numeric | number): Numeric {
    const exp = typeof exponent === 'number' ? exponent : exponent.toNumber()
    return new NativeNumeric(Math.pow(this.value, exp))
  }
  /**
   *
   */
  sqrt(): Numeric {
    return new NativeNumeric(Math.sqrt(this.value))
  }
  /**
   *
   */
  abs(): Numeric {
    return new NativeNumeric(Math.abs(this.value))
  }
  /**
   *
   */
  neg(): Numeric {
    return new NativeNumeric(-this.value)
  }
  /**
   *
   */
  mod(other: Numeric): Numeric {
    return new NativeNumeric(this.value % other.toNumber())
  }

  // ============ MATHEMATICAL FUNCTIONS ============
  /**
   *
   */
  ln(): Numeric {
    return new NativeNumeric(Math.log(this.value))
  }
  /**
   *
   */
  log10(): Numeric {
    return new NativeNumeric(Math.log10(this.value))
  }
  /**
   *
   */
  exp(): Numeric {
    return new NativeNumeric(Math.exp(this.value))
  }
  /**
   *
   */
  sin(): Numeric {
    return new NativeNumeric(Math.sin(this.value))
  }
  /**
   *
   */
  cos(): Numeric {
    return new NativeNumeric(Math.cos(this.value))
  }
  /**
   *
   */
  tan(): Numeric {
    return new NativeNumeric(Math.tan(this.value))
  }
  /**
   *
   */
  asin(): Numeric {
    return new NativeNumeric(Math.asin(this.value))
  }
  /**
   *
   */
  acos(): Numeric {
    return new NativeNumeric(Math.acos(this.value))
  }
  /**
   *
   */
  atan(): Numeric {
    return new NativeNumeric(Math.atan(this.value))
  }
  /**
   *
   */
  sinh(): Numeric {
    return new NativeNumeric(Math.sinh(this.value))
  }
  /**
   *
   */
  cosh(): Numeric {
    return new NativeNumeric(Math.cosh(this.value))
  }
  /**
   *
   */
  tanh(): Numeric {
    return new NativeNumeric(Math.tanh(this.value))
  }
  /**
   *
   */
  asinh(): Numeric {
    return new NativeNumeric(Math.asinh(this.value))
  }
  /**
   *
   */
  acosh(): Numeric {
    return new NativeNumeric(Math.acosh(this.value))
  }
  /**
   *
   */
  atanh(): Numeric {
    return new NativeNumeric(Math.atanh(this.value))
  }

  // ============ ROUNDING OPERATIONS ============
  /**
   *
   */
  floor(): Numeric {
    return new NativeNumeric(Math.floor(this.value))
  }
  /**
   *
   */
  ceil(): Numeric {
    return new NativeNumeric(Math.ceil(this.value))
  }
  /**
   *
   */
  round(): Numeric {
    return new NativeNumeric(Math.round(this.value))
  }
  /**
   *
   */
  trunc(): Numeric {
    return new NativeNumeric(Math.trunc(this.value))
  }
  /**
   *
   */
  toDecimalPlaces(decimalPlaces: number, roundingMode?: RoundingMode): Numeric {
    const factor = Math.pow(10, decimalPlaces)
    let rounded: number

    switch (roundingMode) {
      case RoundingMode.ROUND_UP:
        rounded = this.value >= 0
          ? Math.ceil(this.value * factor) / factor
          : Math.floor(this.value * factor) / factor
        break
      case RoundingMode.ROUND_DOWN:
        rounded = Math.trunc(this.value * factor) / factor
        break
      case RoundingMode.ROUND_CEIL:
        rounded = Math.ceil(this.value * factor) / factor
        break
      case RoundingMode.ROUND_FLOOR:
        rounded = Math.floor(this.value * factor) / factor
        break
      case RoundingMode.ROUND_HALF_DOWN:
        // Round half towards zero
        rounded = this.value >= 0
          ? Math.ceil(this.value * factor - 0.5) / factor
          : Math.floor(this.value * factor + 0.5) / factor
        break
      case RoundingMode.ROUND_HALF_EVEN: {
        // Banker's rounding
        const scaled = this.value * factor
        const floored = Math.floor(scaled)
        const diff = scaled - floored
        if (diff === 0.5) {
          rounded = (floored % 2 === 0 ? floored : floored + 1) / factor
        } else {
          rounded = Math.round(scaled) / factor
        }
        break
      }
      case RoundingMode.ROUND_HALF_CEIL:
        rounded = Math.floor(this.value * factor + 0.5) / factor
        break
      case RoundingMode.ROUND_HALF_FLOOR:
        rounded = Math.ceil(this.value * factor - 0.5) / factor
        break
      case RoundingMode.ROUND_HALF_UP:
      default:
        // Standard rounding (half away from zero)
        rounded = this.value >= 0
          ? Math.floor(this.value * factor + 0.5) / factor
          : Math.ceil(this.value * factor - 0.5) / factor
        break
    }

    return new NativeNumeric(rounded)
  }
  /**
   *
   */
  toSignificantDigits(significantDigits: number, _roundingMode?: RoundingMode): Numeric {
    if (this.value === 0) {
      return new NativeNumeric(0)
    }
    const magnitude = Math.floor(Math.log10(Math.abs(this.value))) + 1
    const factor = Math.pow(10, significantDigits - magnitude)
    return new NativeNumeric(Math.round(this.value * factor) / factor)
  }

  // ============ COMPARISON OPERATIONS ============
  /**
   *
   */
  comparedTo(other: Numeric): number {
    const otherValue = other.toNumber()
    if (this.value < otherValue) return -1
    if (this.value > otherValue) return 1
    return 0
  }
  /**
   *
   */
  equals(other: Numeric): boolean {
    return this.value === other.toNumber()
  }
  /**
   *
   */
  greaterThan(other: Numeric): boolean {
    return this.value > other.toNumber()
  }
  /**
   *
   */
  greaterThanOrEqualTo(other: Numeric): boolean {
    return this.value >= other.toNumber()
  }
  /**
   *
   */
  lessThan(other: Numeric): boolean {
    return this.value < other.toNumber()
  }
  /**
   *
   */
  lessThanOrEqualTo(other: Numeric): boolean {
    return this.value <= other.toNumber()
  }

  // ============ PREDICATES ============
  /**
   *
   */
  isZero(): boolean {
    return this.value === 0
  }
  /**
   *
   */
  isNegative(): boolean {
    return this.value < 0
  }
  /**
   *
   */
  isPositive(): boolean {
    return this.value > 0
  }
  /**
   *
   */
  isInteger(): boolean {
    return Number.isInteger(this.value)
  }
  /**
   *
   */
  isFinite(): boolean {
    return Number.isFinite(this.value)
  }
  /**
   *
   */
  isNaN(): boolean {
    return Number.isNaN(this.value)
  }

  // ============ CONVERSION OPERATIONS ============
  /**
   *
   */
  toNumber(): number {
    return this.value
  }
  /**
   *
   */
  toString(): string {
    return String(this.value)
  }
  /**
   *
   */
  toFixed(decimalPlaces?: number): string {
    return this.value.toFixed(decimalPlaces)
  }
  /**
   *
   */
  toExponential(decimalPlaces?: number): string {
    return this.value.toExponential(decimalPlaces)
  }
  /**
   *
   */
  valueOf(): number {
    return this.value
  }
  /**
   *
   */
  getInternalValue(): number {
    return this.value
  }
}

/**
 * Factory for creating NativeNumeric instances.
 * 
 * This factory provides standard JavaScript number behavior (IEEE-754 float64).
 * Use this for backward compatibility or when precision is not critical.
 * 
 * WARNING: For financial calculations, use DecimalNumericFactory instead.
 * 
 * @example
 * ```typescript
 * // Create the factory
 * const factory = new NativeNumericFactory()
 * 
 * // Use the factory
 * const a = factory.create(0.1)
 * const b = factory.create(0.2)
 * const sum = a.plus(b) // 0.30000000000000004 (IEEE-754 behavior)
 * ```
 */
export class NativeNumericFactory implements NumericFactory {
  private config: NumericConfig

  // Cached constant values
  private cachedZero?: NativeNumeric
  private cachedOne?: NativeNumeric
  private cachedPI?: NativeNumeric
  private cachedE?: NativeNumeric

  constructor(options?: NumericConfig) {
    this.config = {
      precision: 15,  // JS number has ~15-17 significant digits
      rounding: RoundingMode.ROUND_HALF_UP,
      ...options
    }
  }
  /**
   *
   */
  create(value: number | string | Numeric): Numeric {
    if (value instanceof NativeNumeric) {
      return value
    }
    if (typeof value === 'string') {
      return new NativeNumeric(parseFloat(value))
    }
    if (typeof value === 'number') {
      return new NativeNumeric(value)
    }
    // Numeric from another implementation
    return new NativeNumeric(value.toNumber())
  }
  /**
   *
   */
  zero(): Numeric {
    if (!this.cachedZero) {
      this.cachedZero = new NativeNumeric(0)
    }
    return this.cachedZero
  }
  /**
   *
   */
  one(): Numeric {
    if (!this.cachedOne) {
      this.cachedOne = new NativeNumeric(1)
    }
    return this.cachedOne
  }
  /**
   *
   */
  fromNumber(n: number): Numeric {
    return new NativeNumeric(n)
  }
  /**
   *
   */
  fromString(s: string): Numeric {
    return new NativeNumeric(parseFloat(s))
  }
  /**
   *
   */
  PI(): Numeric {
    if (!this.cachedPI) {
      this.cachedPI = new NativeNumeric(Math.PI)
    }
    return this.cachedPI
  }
  /**
   *
   */
  E(): Numeric {
    if (!this.cachedE) {
      this.cachedE = new NativeNumeric(Math.E)
    }
    return this.cachedE
  }
  /**
   *
   */
  POSITIVE_INFINITY(): Numeric {
    return new NativeNumeric(Infinity)
  }
  /**
   *
   */
  NEGATIVE_INFINITY(): Numeric {
    return new NativeNumeric(-Infinity)
  }
  /**
   *
   */
  NaN(): Numeric {
    return new NativeNumeric(NaN)
  }
  /**
   *
   */
  configure(options: NumericConfig): void {
    this.config = { ...this.config, ...options }
  }
  /**
   *
   */
  getConfig(): NumericConfig {
    return { ...this.config }
  }
  /**
   *
   */
  getName(): string {
    return 'native'
  }
}
