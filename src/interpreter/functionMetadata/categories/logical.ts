/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Logical" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const LOGICAL_DOCS: Record<string, FunctionDoc> = {
  AND: {
    category: 'Logical',
    shortDescription: 'Returns TRUE if all arguments are TRUE.',
    parameters: [{name: 'Logical_value1', description: ''}],
  },
  FALSE: {
    category: 'Logical',
    shortDescription: 'Returns the logical value FALSE.',
    parameters: [],
  },
  IF: {
    category: 'Logical',
    shortDescription: 'Specifies a logical test to be performed.',
    parameters: [{name: 'Test', description: ''}, {name: 'Then_value', description: ''}, {name: 'Otherwise_value', description: ''}],
  },
  IFERROR: {
    category: 'Logical',
    shortDescription: 'Returns the value if the cell does not contains an error value, or the alternative value if it does.',
    parameters: [{name: 'Value', description: ''}, {name: 'Alternate_value', description: ''}],
  },
  IFNA: {
    category: 'Logical',
    shortDescription: 'Returns the value if the cell does not contains the #N/A (value not available) error value, or the alternative value if it does.',
    parameters: [{name: 'Value', description: ''}, {name: 'Alternate_value', description: ''}],
  },
  IFS: {
    category: 'Logical',
    shortDescription: 'Evaluates multiple logical tests and returns a value that corresponds to the first true condition.',
    parameters: [{name: 'Condition1', description: ''}, {name: 'Value1', description: ''}],
  },
  NOT: {
    category: 'Logical',
    shortDescription: 'Complements (inverts) a logical value.',
    parameters: [{name: 'Logicalvalue', description: ''}],
  },
  OR: {
    category: 'Logical',
    shortDescription: 'Returns TRUE if at least one argument is TRUE.',
    parameters: [{name: 'Logical_value1', description: ''}],
  },
  SWITCH: {
    category: 'Logical',
    shortDescription: 'Evaluates a list of arguments, consisting of an expression followed by a value.',
    parameters: [{name: 'Expression1', description: ''}, {name: 'Value1', description: ''}, {name: 'Expression2', description: ''}],
  },
  TRUE: {
    category: 'Logical',
    shortDescription: 'The logical value is set to TRUE.',
    parameters: [],
  },
  XOR: {
    category: 'Logical',
    shortDescription: 'Returns true if an odd number of arguments evaluates to TRUE.',
    parameters: [{name: 'Logical_value1', description: ''}],
  },
}
