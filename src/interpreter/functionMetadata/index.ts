/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from './FunctionDescription'
import {ARRAY_MANIPULATION_DOCS} from './categories/array-manipulation'
import {DATABASE_DOCS} from './categories/database'
import {DATE_AND_TIME_DOCS} from './categories/date-and-time'
import {ENGINEERING_DOCS} from './categories/engineering'
import {FINANCIAL_DOCS} from './categories/financial'
import {INFORMATION_DOCS} from './categories/information'
import {LOGICAL_DOCS} from './categories/logical'
import {LOOKUP_AND_REFERENCE_DOCS} from './categories/lookup-and-reference'
import {MATH_AND_TRIGONOMETRY_DOCS} from './categories/math-and-trigonometry'
import {MATRIX_FUNCTIONS_DOCS} from './categories/matrix-functions'
import {OPERATOR_DOCS} from './categories/operator'
import {STATISTICAL_DOCS} from './categories/statistical'
import {TEXT_DOCS} from './categories/text'

export * from './FunctionDescription'

/**
 * Canonical-id-keyed catalogue of human-readable function metadata, composed from the per-category files. This is the
 * source of truth for both the function metadata API and the generated `docs/guide/built-in-functions.md` guide page;
 * edit a category file to change what either reports. Coverage of the whole canonical set is enforced by test.
 *
 * Deliberately prototype-less. The catalogue doubles as the built-in id *set* (see
 * `FunctionRegistry.isBuiltinFunctionId`), and a caller-supplied id is looked up in it directly. With
 * `Object.prototype` in the chain, `FUNCTION_DOCS['toString']` resolves to a function rather than `undefined`, so ids
 * like `toString`, `valueOf` or `__proto__` would report as built-in and pull `Object.prototype` members in as if they
 * were catalogue entries. A null prototype makes every lookup on this object answer only for authored ids.
 */
export const FUNCTION_DOCS: Record<string, FunctionDoc> = Object.assign(Object.create(null) as Record<string, FunctionDoc>, {
  ...ARRAY_MANIPULATION_DOCS,
  ...DATABASE_DOCS,
  ...DATE_AND_TIME_DOCS,
  ...ENGINEERING_DOCS,
  ...FINANCIAL_DOCS,
  ...INFORMATION_DOCS,
  ...LOGICAL_DOCS,
  ...LOOKUP_AND_REFERENCE_DOCS,
  ...MATH_AND_TRIGONOMETRY_DOCS,
  ...MATRIX_FUNCTIONS_DOCS,
  ...OPERATOR_DOCS,
  ...STATISTICAL_DOCS,
  ...TEXT_DOCS,
})
