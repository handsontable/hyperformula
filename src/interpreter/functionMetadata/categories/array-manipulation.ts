/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Array manipulation" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const ARRAY_MANIPULATION_DOCS: Record<string, FunctionDoc> = {
  ARRAY_CONSTRAIN: {
    category: 'Array manipulation',
    shortDescription: 'Truncates an array to given dimensions.',
    parameters: [{name: 'array', description: 'The array or range to truncate.'}, {name: 'height', description: 'The maximum number of rows to keep, automatically capped at the height of Array.'}, {name: 'width', description: 'The maximum number of columns to keep, automatically capped at the width of Array.'}],
    examples: ['=ARRAY_CONSTRAIN(A1:C3, 2, 2)', '=ARRAY_CONSTRAIN(A1:C3, 1, 3)'],
  },
  ARRAYFORMULA: {
    category: 'Array manipulation',
    shortDescription: 'Enables the array arithmetic mode for a single formula.',
    parameters: [{name: 'formula', description: 'The formula or expression to evaluate in array arithmetic mode, so operations are applied element-by-element across the referenced ranges.'}],
    examples: ['=ARRAYFORMULA(A1:A3*B1:B3)', '=SUM(ARRAYFORMULA(A1:A3*B1:B3))'],
  },
  FILTER: {
    category: 'Array manipulation',
    shortDescription: 'Filters an array, based on multiple conditions (boolean arrays).',
    parameters: [{name: 'source_array', description: 'The range of values to filter; it must be a single row or a single column (a two-dimensional range is not supported).'}, {name: 'bool_array1', description: 'A range of boolean values, with the same dimensions as SourceArray, marking which rows or columns to keep; only entries where every boolean array is TRUE are returned. Further boolean arrays can be passed as additional arguments, and all of them must evaluate to TRUE for an entry to be kept.'}],
    examples: ['=FILTER(A1:C1, A2:C2)', '=FILTER(A1:A5, A1:A5>10)', '=FILTER(A1:C1, A2:C2, A3:C3)'],
  },
  SEQUENCE: {
    category: 'Array manipulation',
    shortDescription: 'Returns an array of sequential numbers.',
    parameters: [{name: 'rows', description: 'The number of rows in the returned array. Must be a literal number; a dynamic value such as a cell reference or formula causes a #VALUE! error, since the array size cannot be determined at parse time.'}, {name: 'cols', description: 'The number of columns in the returned array. Defaults to 1 when omitted; like rows, it must be a literal number.'}, {name: 'start', description: 'The first value of the sequence. Defaults to 1 when omitted.'}, {name: 'step', description: 'The increment between consecutive values, filled row by row. Defaults to 1 when omitted.'}],
    examples: ['=SEQUENCE(4)', '=SEQUENCE(3, 2)', '=SEQUENCE(3, 1, 10, 5)'],
  },
  VSTACK: {
    category: 'Array manipulation',
    shortDescription: 'Stacks arrays vertically into a single array.',
    parameters: [{name: 'array1', description: 'A range or array to stack. Further ranges or arrays can be passed as additional arguments; they are stacked top to bottom into one array.'}],
    examples: ['=VSTACK(A1:B2, A3:B4)', '=VSTACK(A1:C1, A2:C2)'],
  },
  HSTACK: {
    category: 'Array manipulation',
    shortDescription: 'Stacks arrays horizontally into a single array.',
    parameters: [{name: 'array1', description: 'A range or array to stack. Further ranges or arrays can be passed as additional arguments; they are stacked left to right into one array.'}],
    examples: ['=HSTACK(A1:A3, B1:B3)', '=HSTACK(A1:B2, C1:D2)'],
  },
}
