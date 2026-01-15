/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Numeric Module
 *
 * This module provides pluggable numeric implementations for HyperFormula,
 * allowing different number systems to be used for calculations.
 *
 * The module is built around the Numeric interface, which allows
 * different implementations to be swapped in:
 *
 * - DecimalNumericFactory: Uses decimal.js for maximum precision (default)
 * - NativeNumericFactory: Uses native JS numbers for performance
 * - Custom implementations: Implement NumericFactory
 *
 * @example
 * ```typescript
 * import {
 *   NumericProvider,
 *   DecimalNumericFactory,
 *   NativeNumericFactory,
 *   RoundingMode
 * } from './Numeric'
 *
 * // Use default (decimal.js)
 * const provider = new NumericProvider()
 *
 * // Use native numbers for performance
 * const fastProvider = new NumericProvider(new NativeNumericFactory())
 *
 * // Create numbers
 * const a = provider.create('0.1')
 * const b = provider.create('0.2')
 * const result = a.plus(b) // Exactly 0.3
 *
 * // Configure precision
 * provider.configure({ precision: 50, rounding: RoundingMode.ROUND_HALF_UP })
 * ```
 *
 * @module Numeric
 */

// Core interface and types
export {
  Numeric,
  NumericFactory,
  NumericConfig,
  RoundingMode,
  isNumeric,
} from './Numeric'

// Provider
export {
  NumericProvider,
  defaultNumericProvider,
  pn
} from './NumericProvider'

// Implementations
export {
  DecimalNumeric,
  DecimalNumericFactory,
  NativeNumeric,
  NativeNumericFactory
} from './implementations'
