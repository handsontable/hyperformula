/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Matrix functions" category. Authored here: this catalogue is the source of
 * truth for the function metadata API, and `docs/guide/built-in-functions.md` is generated from it.
 */
export const MATRIX_FUNCTIONS_DOCS: Record<string, FunctionDoc> = {
  MAXPOOL: {
    category: 'Matrix functions',
    shortDescription: 'Calculates a smaller range which is a maximum of a window_size, in a given range, for every stride element.',
    parameters: [{name: 'range', description: 'The range of numeric values to pool; must contain only numbers.'}, {name: 'window_size', description: 'The width and height, in cells, of the square window whose maximum is taken at each step.'}, {name: 'stride', description: 'The number of cells the window moves between steps; defaults to window_size when omitted.'}],
    examples: ['=MAXPOOL(A1:D4, 2)', '=MAXPOOL(A1:D4, 2, 1)'],
  },
  MEDIANPOOL: {
    category: 'Matrix functions',
    shortDescription: 'Calculates a smaller range which is a median of a window_size, in a given range, for every stride element.',
    parameters: [{name: 'range', description: 'The range of numeric values to pool; must contain only numbers.'}, {name: 'window_size', description: 'The width and height, in cells, of the square window whose median is taken at each step.'}, {name: 'stride', description: 'The number of cells the window moves between steps; defaults to window_size when omitted.'}],
    examples: ['=MEDIANPOOL(A1:D4, 2)', '=MEDIANPOOL(A1:D4, 2, 1)'],
  },
  MMULT: {
    category: 'Matrix functions',
    shortDescription: 'Calculates the array product of two arrays.',
    parameters: [{name: 'array1', description: 'The first range of numbers in the matrix multiplication; its column count must equal the row count of array2.'}, {name: 'array2', description: 'The second range of numbers in the matrix multiplication; its row count must equal the column count of array1.'}],
    examples: ['=MMULT(A1:B2, D1:E2)', '=MMULT(A1:C2, A4:B6)'],
  },
  TRANSPOSE: {
    category: 'Matrix functions',
    shortDescription: 'Transposes the rows and columns of an array.',
    parameters: [{name: 'array', description: 'The range of cells whose rows and columns are swapped in the returned array.'}],
    examples: ['=TRANSPOSE(A1:C2)', '=TRANSPOSE(A1:A5)'],
  },
}
