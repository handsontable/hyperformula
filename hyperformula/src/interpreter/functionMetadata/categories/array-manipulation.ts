/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Array manipulation" category. Authored here: this catalogue is the source of
 * truth for the function metadata API, and `docs/guide/built-in-functions.md` is generated from it.
 */
export const ARRAY_MANIPULATION_DOCS: Record<string, FunctionDoc> = {
  ARRAY_CONSTRAIN: {
    category: 'Array manipulation',
    shortDescription: 'Truncates an array to given dimensions.',
    parameters: [{name: 'array', description: 'The array or range to truncate.'}, {name: 'height', description: 'The maximum number of rows to keep, automatically capped at the height of array.'}, {name: 'width', description: 'The maximum number of columns to keep, automatically capped at the width of array.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=ARRAY_CONSTRAIN(A1:C3, 2, 2)', '=ARRAY_CONSTRAIN(A1:C3, 1, 3)'],
  },
  ARRAYFORMULA: {
    category: 'Array manipulation',
    shortDescription: 'Enables the array arithmetic mode for a single formula.',
    parameters: [{name: 'formula', description: 'The formula or expression to evaluate in array arithmetic mode, so operations are applied element-by-element across the referenced ranges.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=ARRAYFORMULA(A1:A3*B1:B3)', '=SUM(ARRAYFORMULA(A1:A3*B1:B3))'],
  },
}
