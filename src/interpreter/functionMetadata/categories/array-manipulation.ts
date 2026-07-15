/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Array manipulation" category. Generated from `docs/guide/built-in-functions.md` by
 * a one-time migration script (since removed); parameter descriptions are authored in a later phase.
 */
export const ARRAY_MANIPULATION_DOCS: Record<string, FunctionDoc> = {
  ARRAY_CONSTRAIN: {
    category: 'Array manipulation',
    shortDescription: 'Truncates an array to given dimensions.',
    parameters: [{name: 'array', description: ''}, {name: 'height', description: ''}, {name: 'width', description: ''}],
  },
  ARRAYFORMULA: {
    category: 'Array manipulation',
    shortDescription: 'Enables the array arithmetic mode for a single formula.',
    parameters: [{name: 'formula', description: ''}],
  },
  FILTER: {
    category: 'Array manipulation',
    shortDescription: 'Filters an array, based on multiple conditions (boolean arrays).',
    parameters: [{name: 'source_array', description: ''}, {name: 'bool_array1', description: ''}],
  },
  SEQUENCE: {
    category: 'Array manipulation',
    shortDescription: 'Returns an array of sequential numbers.',
    parameters: [{name: 'rows', description: ''}, {name: 'cols', description: ''}, {name: 'start', description: ''}, {name: 'step', description: ''}],
  },
  VSTACK: {
    category: 'Array manipulation',
    shortDescription: 'Stacks arrays vertically into a single array.',
    parameters: [{name: 'array1', description: ''}],
  },
  HSTACK: {
    category: 'Array manipulation',
    shortDescription: 'Stacks arrays horizontally into a single array.',
    parameters: [{name: 'array1', description: ''}],
  },
}
