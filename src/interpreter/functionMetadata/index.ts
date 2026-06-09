/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from './FunctionDescription'
import {MATH_AND_TRIGONOMETRY_DOCS} from './categories/math-and-trigonometry'
import {LOGICAL_DOCS} from './categories/logical'

export * from './FunctionDescription'

/**
 * Canonical-id-keyed catalogue of human-readable function metadata, composed from the per-category files.
 * Coverage of the whole canonical set is enforced by test, not by convention.
 */
export const FUNCTION_DOCS: Record<string, FunctionDoc> = {
  ...MATH_AND_TRIGONOMETRY_DOCS,
  ...LOGICAL_DOCS,
}
