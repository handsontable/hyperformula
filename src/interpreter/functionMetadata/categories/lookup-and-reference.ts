/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Lookup and reference" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const LOOKUP_AND_REFERENCE_DOCS: Record<string, FunctionDoc> = {
  ADDRESS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a cell reference as a string.',
    parameters: [{name: 'row', description: ''}, {name: 'column', description: ''}, {name: 'absolute_relative_mode', description: ''}, {name: 'use_a1_notation', description: ''}, {name: 'sheet', description: ''}],
  },
  CHOOSE: {
    category: 'Lookup and reference',
    shortDescription: 'Uses an index to return a value from a list of values.',
    parameters: [{name: 'index', description: ''}, {name: 'value1', description: ''}],
  },
  COLUMN: {
    category: 'Lookup and reference',
    shortDescription: 'Returns column number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'reference', description: ''}],
  },
  COLUMNS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of columns in the given reference.',
    parameters: [{name: 'array', description: ''}],
  },
  FORMULATEXT: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a formula in a given cell as a string.',
    parameters: [{name: 'reference', description: ''}],
  },
  HLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches horizontally with reference to adjacent cells to the bottom.',
    parameters: [{name: 'search_criterion', description: ''}, {name: 'array', description: ''}, {name: 'index', description: ''}, {name: 'sort_order', description: ''}],
  },
  HYPERLINK: {
    category: 'Lookup and reference',
    shortDescription: 'Stores the url in the cell\'s metadata. It can be read using method [`getCellHyperlink`](../api/classes/hyperformula.md#getcellhyperlink)',
    parameters: [{name: 'url', description: ''}, {name: 'link_label', description: ''}],
  },
  INDEX: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the contents of a cell specified by row and column number. The column number is optional and defaults to 1.',
    parameters: [{name: 'range', description: ''}, {name: 'row', description: ''}, {name: 'column', description: ''}],
  },
  MATCH: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the relative position of an item in an array that matches a specified value.',
    parameters: [{name: 'search_criterion', description: ''}, {name: 'lookup_array', description: ''}, {name: 'match_type', description: ''}],
  },
  ROW: {
    category: 'Lookup and reference',
    shortDescription: 'Returns row number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'reference', description: ''}],
  },
  ROWS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of rows in the given reference.',
    parameters: [{name: 'array', description: ''}],
  },
  VLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches vertically with reference to adjacent cells to the right.',
    parameters: [{name: 'search_criterion', description: ''}, {name: 'array', description: ''}, {name: 'index', description: ''}, {name: 'sort_order', description: ''}],
  },
  XLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches for a key in a range and returns the item corresponding to the match it finds. If no match exists, then XLOOKUP can return the closest (approximate) match.',
    parameters: [{name: 'lookup_value', description: ''}, {name: 'lookup_array', description: ''}, {name: 'return_array', description: ''}, {name: 'if_not_found', description: ''}, {name: 'match_mode', description: ''}, {name: 'search_mode', description: ''}],
  },
}
