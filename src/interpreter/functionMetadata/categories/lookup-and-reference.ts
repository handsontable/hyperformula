/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Lookup and reference" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const LOOKUP_AND_REFERENCE_DOCS: Record<string, FunctionDoc> = {
  ADDRESS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a cell reference as a string.',
    parameters: [
      {name: 'Row', description: 'The row number to use in the constructed cell reference.'},
      {name: 'Column', description: 'The column number to use in the constructed cell reference.'},
      {name: 'AbsoluteRelativeMode', description: '1 for a fully absolute reference (default), 2 for absolute row with relative column, 3 for relative row with absolute column, or 4 for a fully relative reference.'},
      {name: 'UseA1Notation', description: 'TRUE (default) returns the reference in A1 notation, FALSE returns it in R1C1 notation.'},
      {name: 'Sheet', description: 'The name of the sheet to prefix the reference with. When omitted, no sheet name is included.'},
    ],
    examples: ['=ADDRESS(2, 3)', '=ADDRESS(2, 3, 4)', '=ADDRESS(1, 1, 1, FALSE(), "Sheet2")'],
  },
  CHOOSE: {
    category: 'Lookup and reference',
    shortDescription: 'Uses an index to return a value from a list of values.',
    parameters: [
      {name: 'Index', description: 'The 1-based position of the value to return from the list of values that follow.'},
      {name: 'Value1', description: 'A value that can be returned when Index selects its position. Further values can be passed as additional arguments to extend the list Index selects from.'},
    ],
    examples: ['=CHOOSE(2, "apple", "banana", "cherry")', '=CHOOSE(1, A1, A2, A3)'],
  },
  COLUMN: {
    category: 'Lookup and reference',
    shortDescription: 'Returns column number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'Reference', description: 'A cell reference whose column number is returned. When omitted, returns the column number of the cell containing the formula.'}],
    examples: ['=COLUMN(C5)', '=COLUMN()'],
  },
  COLUMNS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of columns in the given reference.',
    parameters: [{name: 'Array', description: 'The range whose number of columns is counted.'}],
    examples: ['=COLUMNS(A1:C5)', '=COLUMNS(A1:F1)'],
  },
  FORMULATEXT: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a formula in a given cell as a string.',
    parameters: [{name: 'Reference', description: 'The cell reference whose formula is returned as text.'}],
    examples: ['=FORMULATEXT(A1)', '=FORMULATEXT(Sheet2!B2)'],
  },
  HLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches horizontally with reference to adjacent cells to the bottom.',
    parameters: [
      {name: 'Search_Criterion', description: 'The value to search for in the first row of Array.'},
      {name: 'Array', description: 'The range to search, with values compared against its first row.'},
      {name: 'Index', description: 'The row number within Array (counting from 1) whose value in the matching column is returned.'},
      {name: 'Sort_Order', description: 'TRUE (default) performs an approximate match against ascending-sorted data, FALSE performs an exact match. HyperFormula skips empty cells when matching approximately.'},
    ],
    examples: ['=HLOOKUP("apple", A1:D5, 3, FALSE())', '=HLOOKUP(5, A1:F2, 2)'],
  },
  HYPERLINK: {
    category: 'Lookup and reference',
    shortDescription: 'Stores the url in the cell\'s metadata. It can be read using method [`getCellHyperlink`](../api/classes/hyperformula.md#getcellhyperlink)',
    parameters: [
      {name: 'Url', description: 'The URL stored in the cell\'s metadata, readable via getCellHyperlink.'},
      {name: 'LinkLabel', description: 'The text displayed in the cell. When omitted, Url is displayed instead.'},
    ],
    examples: ['=HYPERLINK("https://hyperformula.handsontable.com")', '=HYPERLINK("https://hyperformula.handsontable.com", "HyperFormula docs")'],
  },
  INDEX: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the contents of a cell specified by row and column number. The column number is optional and defaults to 1.',
    parameters: [
      {name: 'Range', description: 'The range from which a value is returned.'},
      {name: 'Row', description: 'The row number within Range (counting from 1) of the value to return.'},
      {name: 'Column', description: 'The column number within Range (counting from 1) of the value to return. Defaults to 1 when omitted.'},
    ],
    examples: ['=INDEX(A1:C10, 2, 3)', '=INDEX(A1:A10, 5)'],
  },
  MATCH: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the relative position of an item in an array that matches a specified value.',
    parameters: [
      {name: 'Searchcriterion', description: 'The value to search for in LookupArray.'},
      {name: 'LookupArray', description: 'The single row or column of cells to search.'},
      {name: 'MatchType', description: '1 (default) finds the largest value less than or equal to Searchcriterion in ascending-sorted data, -1 finds the smallest value greater than or equal to it in descending-sorted data, and 0 finds an exact match. HyperFormula skips empty cells when matching with 1 or -1.'},
    ],
    examples: ['=MATCH(5, A1:A10, 0)', '=MATCH("apple", B1:B10)'],
  },
  ROW: {
    category: 'Lookup and reference',
    shortDescription: 'Returns row number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'Reference', description: 'A cell reference whose row number is returned. When omitted, returns the row number of the cell containing the formula.'}],
    examples: ['=ROW(B5)', '=ROW()'],
  },
  ROWS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of rows in the given reference.',
    parameters: [{name: 'Array', description: 'The range whose number of rows is counted.'}],
    examples: ['=ROWS(A1:C5)', '=ROWS(A1:A9)'],
  },
  VLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches vertically with reference to adjacent cells to the right.',
    parameters: [
      {name: 'Search_Criterion', description: 'The value to search for in the first column of Array.'},
      {name: 'Array', description: 'The range to search, with values compared against its first column.'},
      {name: 'Index', description: 'The column number within Array (counting from 1) whose value in the matching row is returned.'},
      {name: 'Sort_Order', description: 'TRUE (default) performs an approximate match against ascending-sorted data, FALSE performs an exact match. HyperFormula skips empty cells when matching approximately.'},
    ],
    examples: ['=VLOOKUP("apple", A1:B10, 2, FALSE())', '=VLOOKUP(5, A1:C10, 3)'],
  },
  XLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches for a key in a range and returns the item corresponding to the match it finds. If no match exists, then XLOOKUP can return the closest (approximate) match.',
    parameters: [
      {name: 'LookupValue', description: 'The value to search for in LookupArray.'},
      {name: 'LookupArray', description: 'The single row or column of cells to search.'},
      {name: 'ReturnArray', description: 'The range that values are returned from once a match is found; it must align in size with LookupArray.'},
      {name: 'IfNotFound', description: 'The value returned when no match is found. Defaults to the #N/A error.'},
      {name: 'MatchMode', description: '0 (default) for an exact match, -1 for an exact match or the next smaller item, 1 for an exact match or the next larger item, or 2 for a wildcard match.'},
      {name: 'SearchMode', description: '1 (default) searches from first to last, -1 searches from last to first, and 2 or -2 perform a binary search on ascending- or descending-sorted data respectively.'},
    ],
    examples: ['=XLOOKUP("apple", A1:A10, B1:B10)', '=XLOOKUP(5, A1:A10, B1:B10, "not found")'],
  },
}
