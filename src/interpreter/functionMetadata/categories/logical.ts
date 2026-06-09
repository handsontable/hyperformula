/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Logical" category. Seeded subset; completed by the migration.
 */
export const LOGICAL_DOCS: Record<string, FunctionDoc> = {
  IFS: {
    category: 'Logical',
    shortDescription: 'Checks one or more conditions and returns the value for the first that is met.',
    parameters: [{name: 'Condition1', description: ''}, {name: 'Value1', description: ''}],
  },
}
