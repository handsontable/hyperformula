/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc, DEFAULT_DOCUMENTATION_URL} from '../FunctionDescription'

/**
 * Catalogue entries for the "Matrix functions" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const MATRIX_FUNCTIONS_DOCS: Record<string, FunctionDoc> = {
  MAXPOOL: {
    category: 'Matrix functions',
    documentationUrl: DEFAULT_DOCUMENTATION_URL,
    shortDescription: 'Calculates a smaller range which is a maximum of a Window_size, in a given Range, for every Stride element.',
    parameters: [{name: 'range', description: 'The range of numeric values to pool; must contain only numbers.'}, {name: 'window_size', description: 'The width and height, in cells, of the square window whose maximum is taken at each step.'}, {name: 'stride', description: 'The number of cells the window moves between steps; defaults to Window_size when omitted.'}],
    examples: ['=MAXPOOL(A1:D4, 2)', '=MAXPOOL(A1:D4, 2, 1)'],
  },
  MEDIANPOOL: {
    category: 'Matrix functions',
    documentationUrl: DEFAULT_DOCUMENTATION_URL,
    shortDescription: 'Calculates a smaller range which is a median of a Window_size, in a given Range, for every Stride element.',
    parameters: [{name: 'range', description: 'The range of numeric values to pool; must contain only numbers.'}, {name: 'window_size', description: 'The width and height, in cells, of the square window whose median is taken at each step.'}, {name: 'stride', description: 'The number of cells the window moves between steps; defaults to Window_size when omitted.'}],
    examples: ['=MEDIANPOOL(A1:D4, 2)', '=MEDIANPOOL(A1:D4, 2, 1)'],
  },
  MMULT: {
    category: 'Matrix functions',
    documentationUrl: DEFAULT_DOCUMENTATION_URL,
    shortDescription: 'Calculates the array product of two arrays.',
    parameters: [{name: 'array1', description: 'The first range of numbers in the matrix multiplication; its column count must equal the row count of Array2.'}, {name: 'array2', description: 'The second range of numbers in the matrix multiplication; its row count must equal the column count of Array1.'}],
    examples: ['=MMULT(A1:B2, D1:E2)', '=MMULT(A1:C2, A4:B6)'],
  },
  TRANSPOSE: {
    category: 'Matrix functions',
    documentationUrl: DEFAULT_DOCUMENTATION_URL,
    shortDescription: 'Transposes the rows and columns of an array.',
    parameters: [{name: 'array', description: 'The range of cells whose rows and columns are swapped in the returned array.'}],
    examples: ['=TRANSPOSE(A1:C2)', '=TRANSPOSE(A1:A5)'],
  },
}
