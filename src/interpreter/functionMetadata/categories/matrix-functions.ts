/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Matrix functions" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const MATRIX_FUNCTIONS_DOCS: Record<string, FunctionDoc> = {
  MAXPOOL: {
    category: 'Matrix functions',
    shortDescription: 'Calculates a smaller range which is a maximum of a Window_size, in a given Range, for every Stride element.',
    parameters: [{name: 'range', description: ''}, {name: 'window_size', description: ''}, {name: 'stride', description: ''}],
  },
  MEDIANPOOL: {
    category: 'Matrix functions',
    shortDescription: 'Calculates a smaller range which is a median of a Window_size, in a given Range, for every Stride element.',
    parameters: [{name: 'range', description: ''}, {name: 'window_size', description: ''}, {name: 'stride', description: ''}],
  },
  MMULT: {
    category: 'Matrix functions',
    shortDescription: 'Calculates the array product of two arrays.',
    parameters: [{name: 'array1', description: ''}, {name: 'array2', description: ''}],
  },
  TRANSPOSE: {
    category: 'Matrix functions',
    shortDescription: 'Transposes the rows and columns of an array.',
    parameters: [{name: 'array', description: ''}],
  },
}
