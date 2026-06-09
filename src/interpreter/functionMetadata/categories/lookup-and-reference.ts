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
    parameters: [{name: 'Row', description: ''}, {name: 'Column', description: ''}, {name: 'AbsoluteRelativeMode', description: ''}, {name: 'UseA1Notation', description: ''}, {name: 'Sheet', description: ''}],
  },
  CHOOSE: {
    category: 'Lookup and reference',
    shortDescription: 'Uses an index to return a value from a list of values.',
    parameters: [{name: 'Index', description: ''}, {name: 'Value1', description: ''}],
  },
  COLUMN: {
    category: 'Lookup and reference',
    shortDescription: 'Returns column number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'Reference', description: ''}],
  },
  COLUMNS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of columns in the given reference.',
    parameters: [{name: 'Array', description: ''}],
  },
  FORMULATEXT: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a formula in a given cell as a string.',
    parameters: [{name: 'Reference', description: ''}],
  },
  HLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches horizontally with reference to adjacent cells to the bottom.',
    parameters: [{name: 'Search_Criterion', description: ''}, {name: 'Array', description: ''}, {name: 'Index', description: ''}, {name: 'Sort_Order', description: ''}],
  },
  HYPERLINK: {
    category: 'Lookup and reference',
    shortDescription: 'Stores the url in the cell\'s metadata. It can be read using method [`getCellHyperlink`](../api/classes/hyperformula.md#getcellhyperlink)',
    parameters: [{name: 'Url', description: ''}, {name: 'LinkLabel', description: ''}],
  },
  INDEX: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the contents of a cell specified by row and column number. The column number is optional and defaults to 1.',
    parameters: [{name: 'Range', description: ''}, {name: 'Row', description: ''}, {name: 'Column', description: ''}],
  },
  MATCH: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the relative position of an item in an array that matches a specified value.',
    parameters: [{name: 'Searchcriterion', description: ''}, {name: 'LookupArray', description: ''}, {name: 'MatchType', description: ''}],
  },
  ROW: {
    category: 'Lookup and reference',
    shortDescription: 'Returns row number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'Reference', description: ''}],
  },
  ROWS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of rows in the given reference.',
    parameters: [{name: 'Array', description: ''}],
  },
  VLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches vertically with reference to adjacent cells to the right.',
    parameters: [{name: 'Search_Criterion', description: ''}, {name: 'Array', description: ''}, {name: 'Index', description: ''}, {name: 'Sort_Order', description: ''}],
  },
  XLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches for a key in a range and returns the item corresponding to the match it finds. If no match exists, then XLOOKUP can return the closest (approximate) match.',
    parameters: [{name: 'LookupValue', description: ''}, {name: 'LookupArray', description: ''}, {name: 'ReturnArray', description: ''}, {name: 'IfNotFound', description: ''}, {name: 'MatchMode', description: ''}, {name: 'SearchMode', description: ''}],
  },
}
