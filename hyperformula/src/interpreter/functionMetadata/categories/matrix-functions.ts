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
    shortDescription: 'Calculates a smaller range which is a maximum of a window_size, in a given range, for every stride element.<br>The windows must fit range exactly: window_size cannot exceed either dimension of range, and both dimensions of range, reduced by window_size, must be whole multiples of stride. Otherwise the function returns the #VALUE! error. A window_size or stride that is not a positive integer returns the #NUM! error.',
    parameters: [{name: 'range', description: 'The range of numeric values to pool; must contain only numbers, otherwise the function returns the #VALUE! error.'}, {name: 'window_size', description: 'The width and height, in cells, of the square window whose maximum is taken at each step; a positive integer that is not greater than either dimension of range.'}, {name: 'stride', description: 'The number of cells the window moves between steps; a positive integer that defaults to window_size when omitted. Both dimensions of range, reduced by window_size, must be whole multiples of it. A stride greater than window_size skips the rows and columns between the windows.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MAXPOOL(A1:D4, 2)', '=MAXPOOL(A1:D4, 2, 1)'],
  },
  MEDIANPOOL: {
    category: 'Matrix functions',
    shortDescription: 'Calculates a smaller range which is a median of a window_size, in a given range, for every stride element.<br>The windows must fit range exactly: window_size cannot exceed either dimension of range, and both dimensions of range, reduced by window_size, must be whole multiples of stride. Otherwise the function returns the #VALUE! error. A window_size or stride that is not a positive integer returns the #NUM! error.',
    parameters: [{name: 'range', description: 'The range of numeric values to pool; must contain only numbers, otherwise the function returns the #VALUE! error.'}, {name: 'window_size', description: 'The width and height, in cells, of the square window whose median is taken at each step; a positive integer that is not greater than either dimension of range.'}, {name: 'stride', description: 'The number of cells the window moves between steps; a positive integer that defaults to window_size when omitted. Both dimensions of range, reduced by window_size, must be whole multiples of it. A stride greater than window_size skips the rows and columns between the windows.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MEDIANPOOL(A1:D4, 2)', '=MEDIANPOOL(A1:D4, 2, 1)'],
  },
  MDETERM: {
    category: 'Matrix functions',
    shortDescription: 'Calculates the determinant of a square array. A non-square array or an array with a non-numeric value returns the #VALUE! error.',
    parameters: [{name: 'array', description: 'The square range or array of numbers whose determinant is calculated.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MDETERM(A1:B2)', '=MDETERM({1,2;3,4})'],
  },
  MINVERSE: {
    category: 'Matrix functions',
    shortDescription: 'Calculates the inverse of a square array. A non-square array or an array with a non-numeric value returns the #VALUE! error; a singular array returns the #NUM! error.',
    parameters: [{name: 'array', description: 'The square range or array of numbers to invert.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MINVERSE(A1:B2)', '=MINVERSE({1,2;3,4})'],
  },
  MMULT: {
    category: 'Matrix functions',
    shortDescription: 'Calculates the array product of two arrays.',
    parameters: [{name: 'array1', description: 'The first range of numbers in the matrix multiplication; its column count must equal the row count of array2.'}, {name: 'array2', description: 'The second range of numbers in the matrix multiplication; its row count must equal the column count of array1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MMULT(A1:B2, D1:E2)', '=MMULT(A1:C2, A4:B6)'],
  },
  MUNIT: {
    category: 'Matrix functions',
    shortDescription: 'Returns the identity matrix of the given dimension. A fractional dimension is truncated; a dimension below 1 or a non-numeric one returns the #VALUE! error.',
    parameters: [{name: 'dimension', description: 'The number of rows and columns of the returned matrix.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MUNIT(3)', '=MMULT(A1:C3, MUNIT(3))'],
  },
}
