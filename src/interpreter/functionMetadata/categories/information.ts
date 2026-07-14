/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Information" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const INFORMATION_DOCS: Record<string, FunctionDoc> = {
  ISBINARY: {
    category: 'Information',
    shortDescription: 'Returns TRUE if provided value is a valid binary number.',
    parameters: [{name: 'value', description: ''}],
  },
  ISBLANK: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the reference to a cell is blank.',
    parameters: [{name: 'value', description: ''}],
  },
  ISERR: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is error value except #N/A!.',
    parameters: [{name: 'value', description: ''}],
  },
  ISERROR: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is general error value.',
    parameters: [{name: 'value', description: ''}],
  },
  ISEVEN: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is an even integer, or FALSE if the value is odd.',
    parameters: [{name: 'value', description: ''}],
  },
  ISFORMULA: {
    category: 'Information',
    shortDescription: 'Checks whether referenced cell is a formula.',
    parameters: [{name: 'value', description: ''}],
  },
  ISLOGICAL: {
    category: 'Information',
    shortDescription: 'Tests for a logical value (TRUE or FALSE).',
    parameters: [{name: 'value', description: ''}],
  },
  ISNA: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is #N/A! error.',
    parameters: [{name: 'value', description: ''}],
  },
  ISNONTEXT: {
    category: 'Information',
    shortDescription: 'Tests if the cell contents are text or numbers, and returns FALSE if the contents are text.',
    parameters: [{name: 'value', description: ''}],
  },
  ISNUMBER: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value refers to a number.',
    parameters: [{name: 'value', description: ''}],
  },
  ISODD: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is odd, or FALSE if the number is even.',
    parameters: [{name: 'value', description: ''}],
  },
  ISREF: {
    category: 'Information',
    shortDescription: 'Returns TRUE if provided value is #REF! error.',
    parameters: [{name: 'value', description: ''}],
  },
  ISTEXT: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the cell contents reference text.',
    parameters: [{name: 'value', description: ''}],
  },
  NA: {
    category: 'Information',
    shortDescription: 'Returns #N/A! error value.',
    parameters: [],
  },
  SHEET: {
    category: 'Information',
    shortDescription: 'Returns sheet number of a given value or a formula sheet number if no argument is provided.',
    parameters: [{name: 'value', description: ''}],
  },
  SHEETS: {
    category: 'Information',
    shortDescription: 'Returns number of sheet of a given reference or number of all sheets in workbook when no argument is provided.',
    parameters: [{name: 'value', description: ''}],
  },
}
