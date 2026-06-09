/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Math and trigonometry" category. Seeded subset; completed by the migration.
 */
export const MATH_AND_TRIGONOMETRY_DOCS: Record<string, FunctionDoc> = {
  SUMIF: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums the cells that meet a criterion.',
    parameters: [{name: 'Range', description: ''}, {name: 'Criterion', description: ''}, {name: 'SumRange', description: ''}],
  },
  SUM: {
    category: 'Math and trigonometry',
    shortDescription: 'Sums a series of numbers or cells.',
    parameters: [{name: 'Number1', description: ''}],
  },
  PI: {
    category: 'Math and trigonometry',
    shortDescription: 'Returns the value of pi.',
    parameters: [],
  },
}
