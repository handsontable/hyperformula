/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  Numeric,
  NumericFactory,
  NumericConfig
} from './Numeric'
import { DecimalNumericFactory } from './implementations/DecimalNumeric'

/**
 * Provider for Numeric instances.
 * 
 * This class provides a centralized way to create precision numbers
 * using a configurable factory. It supports both instance-level and
 * global configuration.
 * 
 * By default, it uses DecimalNumericFactory for maximum precision.
 * You can inject a different factory (e.g., NativeNumericFactory) for
 * better performance.
 * 
 * @example
 * ```typescript
 * // Use default decimal.js factory
 * const provider = new NumericProvider()
 * const num = provider.create('0.1')
 * 
 * // Use custom factory (native numbers for performance)
 * const nativeProvider = new NumericProvider(new NativeNumericFactory())
 * 
 * // Configure global default
 * NumericProvider.setGlobalFactory(new NativeNumericFactory())
 * ```
 */
export class NumericProvider {
  /**
   * Global factory instance used as default when no factory is specified.
   */
  private static globalFactory: NumericFactory = new DecimalNumericFactory()

  /**
   * Instance-specific factory.
   */
  private factory: NumericFactory

  /**
   * Creates a new NumericProvider.
   * @param {NumericFactory} [factory] Optional factory to use. If not provided, uses the global factory.
   */
  constructor(factory?: NumericFactory) {
    this.factory = factory ?? NumericProvider.globalFactory
  }

  // ============ INSTANCE METHODS ============

  /**
   * Returns the factory used by this provider.
   */
  getFactory(): NumericFactory {
    return this.factory
  }

  /**
   * Sets the factory for this provider.
   * @param {NumericFactory} factory The factory to use
   */
  setFactory(factory: NumericFactory): void {
    this.factory = factory
  }

  /**
   * Creates a new Numeric from the given value.
   * @param {number | string | Numeric} value Number, string, or Numeric
   */
  create(value: number | string | Numeric): Numeric {
    return this.factory.create(value)
  }

  /**
   * Returns zero.
   */
  zero(): Numeric {
    return this.factory.zero()
  }

  /**
   * Returns one.
   */
  one(): Numeric {
    return this.factory.one()
  }

  /**
   * Creates from a JavaScript number.
   */
  fromNumber(n: number): Numeric {
    return this.factory.fromNumber(n)
  }

  /**
   * Creates from a string.
   */
  fromString(s: string): Numeric {
    return this.factory.fromString(s)
  }

  /**
   * Returns PI.
   */
  PI(): Numeric {
    return this.factory.PI()
  }

  /**
   * Returns E (Euler's number).
   */
  E(): Numeric {
    return this.factory.E()
  }

  /**
   * Returns positive infinity.
   */
  POSITIVE_INFINITY(): Numeric {
    return this.factory.POSITIVE_INFINITY()
  }

  /**
   * Returns negative infinity.
   */
  NEGATIVE_INFINITY(): Numeric {
    return this.factory.NEGATIVE_INFINITY()
  }

  /**
   * Returns NaN.
   */
  NaN(): Numeric {
    return this.factory.NaN()
  }

  /**
   * Configures the factory.
   */
  configure(options: NumericConfig): void {
    this.factory.configure(options)
  }

  /**
   * Returns the current configuration.
   */
  getConfig(): NumericConfig {
    return this.factory.getConfig()
  }

  /**
   * Returns the implementation name.
   */
  getName(): string {
    return this.factory.getName()
  }

  // ============ STATIC METHODS ============

  /**
   * Gets the global default factory.
   */
  static getGlobalFactory(): NumericFactory {
    return NumericProvider.globalFactory
  }

  /**
   * Sets the global default factory.
   * This affects all new NumericProvider instances that don't
   * specify a factory.
   * @param {NumericFactory} factory The factory to use as global default
   */
  static setGlobalFactory(factory: NumericFactory): void {
    NumericProvider.globalFactory = factory
  }

  /**
   * Configures the global factory.
   * @param {NumericConfig} options Configuration options
   */
  static configureGlobal(options: NumericConfig): void {
    NumericProvider.globalFactory.configure(options)
  }

  /**
   * Resets the global factory to the default (DecimalNumericFactory).
   */
  static resetToDefault(): void {
    NumericProvider.globalFactory = new DecimalNumericFactory()
  }

  /**
   * Creates a value using the global factory.
   * Convenience method for quick one-off creations.
   * @param {number | string | Numeric} value The value to create
   */
  static createGlobal(value: number | string | Numeric): Numeric {
    return NumericProvider.globalFactory.create(value)
  }
}

/**
 * Default precision number provider instance.
 * Can be used directly without creating a new provider.
 */
export const defaultNumericProvider = new NumericProvider()

/**
 * Convenience helper for creating precision numbers.
 * Uses the global factory.
 * 
 * @example
 * ```typescript
 * import { pn } from './Numeric'
 * 
 * const a = pn.create('0.1')
 * const b = pn.create('0.2')
 * const sum = a.plus(b) // 0.3
 * 
 * const pi = pn.PI()
 * const zero = pn.zero()
 * ```
 */
export const pn = {
  /**
   * Creates a precision number from a value.
   */
  create: (value: number | string): Numeric =>
    NumericProvider.getGlobalFactory().create(value),

  /**
   * Returns zero.
   */
  zero: (): Numeric =>
    NumericProvider.getGlobalFactory().zero(),

  /**
   * Returns one.
   */
  one: (): Numeric =>
    NumericProvider.getGlobalFactory().one(),

  /**
   * Returns PI.
   */
  PI: (): Numeric =>
    NumericProvider.getGlobalFactory().PI(),

  /**
   * Returns E.
   */
  E: (): Numeric =>
    NumericProvider.getGlobalFactory().E(),

  /**
   * Returns positive infinity.
   */
  infinity: (): Numeric =>
    NumericProvider.getGlobalFactory().POSITIVE_INFINITY(),

  /**
   * Returns negative infinity.
   */
  negInfinity: (): Numeric =>
    NumericProvider.getGlobalFactory().NEGATIVE_INFINITY(),

  /**
   * Returns NaN.
   */
  nan: (): Numeric =>
    NumericProvider.getGlobalFactory().NaN(),
}
