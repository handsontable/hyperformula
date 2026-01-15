/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import Decimal from 'decimal.js'
import {
  Numeric,
  NumericFactory,
  NumericConfig,
  RoundingMode
} from '../Numeric'

/**
 * Maps our RoundingMode enum to decimal.js rounding modes.
 */
const ROUNDING_MODE_MAP: Record<RoundingMode, Decimal.Rounding> = {
  [RoundingMode.ROUND_UP]: Decimal.ROUND_UP,
  [RoundingMode.ROUND_DOWN]: Decimal.ROUND_DOWN,
  [RoundingMode.ROUND_CEIL]: Decimal.ROUND_CEIL,
  [RoundingMode.ROUND_FLOOR]: Decimal.ROUND_FLOOR,
  [RoundingMode.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
  [RoundingMode.ROUND_HALF_DOWN]: Decimal.ROUND_HALF_DOWN,
  [RoundingMode.ROUND_HALF_EVEN]: Decimal.ROUND_HALF_EVEN,
  [RoundingMode.ROUND_HALF_CEIL]: Decimal.ROUND_HALF_CEIL,
  [RoundingMode.ROUND_HALF_FLOOR]: Decimal.ROUND_HALF_FLOOR,
}

/**
 * Implementation of Numeric using decimal.js library.
 * 
 * This is the default implementation, providing the highest precision
 * and most complete set of mathematical functions.
 * 
 * decimal.js provides:
 * - Arbitrary precision decimal arithmetic
 * - All trigonometric functions with full precision
 * - Configurable precision and rounding modes
 * - IEEE 754 compliant
 * 
 * @see https://mikemcl.github.io/decimal.js/
 */
export class DecimalNumeric implements Numeric {
  /**
   * Creates a new DecimalNumeric wrapping a Decimal value.
   * @param {Decimal} value The decimal.js Decimal value
   */
  constructor(private readonly value: Decimal) {}

  // ============ ARITHMETIC OPERATIONS ============
  /**
   *
   */
  plus(other: Numeric): Numeric {
    return new DecimalNumeric(this.value.plus(this.unwrap(other)))
  }
  /**
   *
   */
  minus(other: Numeric): Numeric {
    return new DecimalNumeric(this.value.minus(this.unwrap(other)))
  }
  /**
   *
   */
  times(other: Numeric): Numeric {
    return new DecimalNumeric(this.value.times(this.unwrap(other)))
  }
  /**
   *
   */
  dividedBy(other: Numeric): Numeric {
    return new DecimalNumeric(this.value.dividedBy(this.unwrap(other)))
  }
  /**
   *
   */
  pow(exponent: Numeric | number): Numeric {
    const exp = typeof exponent === 'number' ? exponent : this.unwrap(exponent)
    return new DecimalNumeric(this.value.pow(exp))
  }
  /**
   *
   */
  sqrt(): Numeric {
    return new DecimalNumeric(this.value.sqrt())
  }
  /**
   *
   */
  abs(): Numeric {
    return new DecimalNumeric(this.value.abs())
  }
  /**
   *
   */
  neg(): Numeric {
    return new DecimalNumeric(this.value.neg())
  }
  /**
   *
   */
  mod(other: Numeric): Numeric {
    return new DecimalNumeric(this.value.mod(this.unwrap(other)))
  }

  // ============ MATHEMATICAL FUNCTIONS ============
  /**
   *
   */
  ln(): Numeric {
    return new DecimalNumeric(this.value.ln())
  }
  /**
   *
   */
  log10(): Numeric {
    return new DecimalNumeric(this.value.log(10))
  }
  /**
   *
   */
  exp(): Numeric {
    return new DecimalNumeric(this.value.exp())
  }
  /**
   *
   */
  sin(): Numeric {
    return new DecimalNumeric(this.value.sin())
  }
  /**
   *
   */
  cos(): Numeric {
    return new DecimalNumeric(this.value.cos())
  }
  /**
   *
   */
  tan(): Numeric {
    return new DecimalNumeric(this.value.tan())
  }
  /**
   *
   */
  asin(): Numeric {
    return new DecimalNumeric(this.value.asin())
  }
  /**
   *
   */
  acos(): Numeric {
    return new DecimalNumeric(this.value.acos())
  }
  /**
   *
   */
  atan(): Numeric {
    return new DecimalNumeric(this.value.atan())
  }
  /**
   *
   */
  sinh(): Numeric {
    return new DecimalNumeric(this.value.sinh())
  }
  /**
   *
   */
  cosh(): Numeric {
    return new DecimalNumeric(this.value.cosh())
  }
  /**
   *
   */
  tanh(): Numeric {
    return new DecimalNumeric(this.value.tanh())
  }
  /**
   *
   */
  asinh(): Numeric {
    return new DecimalNumeric(this.value.asinh())
  }
  /**
   *
   */
  acosh(): Numeric {
    return new DecimalNumeric(this.value.acosh())
  }
  /**
   *
   */
  atanh(): Numeric {
    return new DecimalNumeric(this.value.atanh())
  }

  // ============ ROUNDING OPERATIONS ============
  /**
   *
   */
  floor(): Numeric {
    return new DecimalNumeric(this.value.floor())
  }
  /**
   *
   */
  ceil(): Numeric {
    return new DecimalNumeric(this.value.ceil())
  }
  /**
   *
   */
  round(): Numeric {
    return new DecimalNumeric(this.value.round())
  }
  /**
   *
   */
  trunc(): Numeric {
    return new DecimalNumeric(this.value.trunc())
  }
  /**
   *
   */
  toDecimalPlaces(decimalPlaces: number, roundingMode?: RoundingMode): Numeric {
    if (roundingMode !== undefined) {
      return new DecimalNumeric(this.value.toDecimalPlaces(decimalPlaces, ROUNDING_MODE_MAP[roundingMode]))
    }
    return new DecimalNumeric(this.value.toDecimalPlaces(decimalPlaces))
  }
  /**
   *
   */
  toSignificantDigits(significantDigits: number, roundingMode?: RoundingMode): Numeric {
    if (roundingMode !== undefined) {
      return new DecimalNumeric(this.value.toSignificantDigits(significantDigits, ROUNDING_MODE_MAP[roundingMode]))
    }
    return new DecimalNumeric(this.value.toSignificantDigits(significantDigits))
  }

  // ============ COMPARISON OPERATIONS ============
  /**
   *
   */
  comparedTo(other: Numeric): number {
    return this.value.comparedTo(this.unwrap(other))
  }
  /**
   *
   */
  equals(other: Numeric): boolean {
    return this.value.equals(this.unwrap(other))
  }
  /**
   *
   */
  greaterThan(other: Numeric): boolean {
    return this.value.greaterThan(this.unwrap(other))
  }
  /**
   *
   */
  greaterThanOrEqualTo(other: Numeric): boolean {
    return this.value.greaterThanOrEqualTo(this.unwrap(other))
  }
  /**
   *
   */
  lessThan(other: Numeric): boolean {
    return this.value.lessThan(this.unwrap(other))
  }
  /**
   *
   */
  lessThanOrEqualTo(other: Numeric): boolean {
    return this.value.lessThanOrEqualTo(this.unwrap(other))
  }

  // ============ PREDICATES ============
  /**
   *
   */
  isZero(): boolean {
    return this.value.isZero()
  }
  /**
   *
   */
  isNegative(): boolean {
    return this.value.isNegative()
  }
  /**
   *
   */
  isPositive(): boolean {
    return this.value.isPositive()
  }
  /**
   *
   */
  isInteger(): boolean {
    return this.value.isInteger()
  }
  /**
   *
   */
  isFinite(): boolean {
    return this.value.isFinite()
  }
  /**
   *
   */
  isNaN(): boolean {
    return this.value.isNaN()
  }

  // ============ CONVERSION OPERATIONS ============
  /**
   *
   */
  toNumber(): number {
    return this.value.toNumber()
  }
  /**
   *
   */
  toString(): string {
    return this.value.toString()
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
    return this.value.toNumber()
  }
  /**
   *
   */
  getInternalValue(): Decimal {
    return this.value
  }

  // ============ PRIVATE HELPERS ============

  /**
   * Extracts the Decimal value from an Numeric.
   * Handles both DecimalNumeric instances and other implementations.
   */
  private unwrap(other: Numeric): Decimal {
    if (other instanceof DecimalNumeric) {
      return other.value
    }
    // Fallback: convert to string and create new Decimal
    return new Decimal(other.toString())
  }
}

/**
 * Factory for creating DecimalNumeric instances.
 * 
 * This is the default factory providing the highest precision arithmetic.
 * Uses decimal.js under the hood with configurable precision settings.
 * 
 * @example
 * ```typescript
 * // Create with default settings (34 digits precision)
 * const factory = new DecimalNumericFactory()
 * 
 * // Create with custom precision
 * const factory = new DecimalNumericFactory({ precision: 50 })
 * 
 * // Use the factory
 * const a = factory.create('0.1')
 * const b = factory.create('0.2')
 * const sum = a.plus(b) // Exactly 0.3
 * ```
 */
export class DecimalNumericFactory implements NumericFactory {
  private config: NumericConfig

  // Cached constant values
  private cachedZero?: DecimalNumeric
  private cachedOne?: DecimalNumeric
  private cachedPI?: DecimalNumeric
  private cachedE?: DecimalNumeric

  constructor(options?: NumericConfig) {
    this.config = {
      precision: 34,
      rounding: RoundingMode.ROUND_HALF_UP,
      minExponent: -18,
      maxExponent: 18,
      ...options
    }
    this.applyConfig()
  }
  /**
   *
   */
  create(value: number | string | Numeric): Numeric {
    if (value instanceof DecimalNumeric) {
      return value
    }
    if (typeof value === 'object' && 'toString' in value) {
      return new DecimalNumeric(new Decimal(value.toString()))
    }
    return new DecimalNumeric(new Decimal(value))
  }
  /**
   *
   */
  zero(): Numeric {
    if (!this.cachedZero) {
      this.cachedZero = new DecimalNumeric(new Decimal(0))
    }
    return this.cachedZero
  }
  /**
   *
   */
  one(): Numeric {
    if (!this.cachedOne) {
      this.cachedOne = new DecimalNumeric(new Decimal(1))
    }
    return this.cachedOne
  }
  /**
   *
   */
  fromNumber(n: number): Numeric {
    return new DecimalNumeric(new Decimal(n))
  }
  /**
   *
   */
  fromString(s: string): Numeric {
    return new DecimalNumeric(new Decimal(s))
  }
  /**
   *
   */
  PI(): Numeric {
    if (!this.cachedPI) {
      // Use Decimal's built-in PI calculation
      this.cachedPI = new DecimalNumeric(Decimal.acos(-1))
    }
    return this.cachedPI
  }
  /**
   *
   */
  E(): Numeric {
    if (!this.cachedE) {
      // Use Decimal's built-in E calculation
      this.cachedE = new DecimalNumeric(Decimal.exp(1))
    }
    return this.cachedE
  }
  /**
   *
   */
  POSITIVE_INFINITY(): Numeric {
    return new DecimalNumeric(new Decimal(Infinity))
  }
  /**
   *
   */
  NEGATIVE_INFINITY(): Numeric {
    return new DecimalNumeric(new Decimal(-Infinity))
  }
  /**
   *
   */
  NaN(): Numeric {
    return new DecimalNumeric(new Decimal(NaN))
  }
  /**
   *
   */
  configure(options: NumericConfig): void {
    this.config = { ...this.config, ...options }
    this.applyConfig()
    // Clear cached values that depend on precision
    this.cachedPI = undefined
    this.cachedE = undefined
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
    return 'decimal.js'
  }

  /**
   * Applies the current configuration to the Decimal library.
   */
  private applyConfig(): void {
    Decimal.set({
      precision: this.config.precision ?? 34,
      rounding: ROUNDING_MODE_MAP[this.config.rounding ?? RoundingMode.ROUND_HALF_UP],
      toExpNeg: this.config.minExponent ?? -18,
      toExpPos: this.config.maxExponent ?? 18,
    })
  }
}
