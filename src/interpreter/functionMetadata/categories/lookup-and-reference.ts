/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Lookup and reference" category. Authored here: this catalogue is the source of truth
 * for the function metadata API, and `docs/guide/built-in-functions.md` is generated from it. Includes the protected
 * `OFFSET` function, whose structural metadata lives in `protectedFunctionMetadata.ts` rather than in a plugin.
 */
export const LOOKUP_AND_REFERENCE_DOCS: Record<string, FunctionDoc> = {
  ADDRESS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a cell reference as a string.',
    parameters: [{name: 'row', description: 'The row number to use in the constructed cell reference.'}, {name: 'column', description: 'The column number to use in the constructed cell reference.'}, {name: 'absolute_relative_mode', description: '1 for a fully absolute reference (default), 2 for absolute row with relative column, 3 for relative row with absolute column, or 4 for a fully relative reference.'}, {name: 'use_a1_notation', description: 'TRUE (default) returns the reference in A1 notation, FALSE returns it in R1C1 notation.'}, {name: 'sheet', description: 'The name of the sheet to prefix the reference with. When omitted, no sheet name is included.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=ADDRESS(2, 3)', '=ADDRESS(2, 3, 4)', '=ADDRESS(1, 1, 1, FALSE(), "Sheet2")'],
  },
  CHOOSE: {
    category: 'Lookup and reference',
    shortDescription: 'Uses an index to return a value from a list of values.',
    parameters: [{name: 'index', description: 'The 1-based position of the value to return from the list of values that follow.'}, {name: 'value1', description: 'A value that can be returned when index selects its position. Further values can be passed as additional arguments to extend the list index selects from.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=CHOOSE(2, "apple", "banana", "cherry")', '=CHOOSE(1, A1, A2, A3)'],
  },
  COLUMN: {
    category: 'Lookup and reference',
    shortDescription: 'Returns column number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'reference', description: 'A cell reference whose column number is returned. When omitted, returns the column number of the cell containing the formula.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=COLUMN(C5)', '=COLUMN()'],
  },
  COLUMNS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of columns in the given reference.',
    parameters: [{name: 'array', description: 'The range whose number of columns is counted.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=COLUMNS(A1:C5)', '=COLUMNS(A1:F1)'],
  },
  FILTER: {
    category: 'Lookup and reference',
    shortDescription: 'Filters an array, based on multiple conditions (boolean arrays).',
    parameters: [{name: 'source_array', description: 'The range of values to filter; it must be a single row or a single column (a two-dimensional range is not supported).'}, {name: 'bool_array1', description: 'A range of boolean values, with the same dimensions as source_array, marking which rows or columns to keep; only entries where every boolean array is TRUE are returned. Further boolean arrays can be passed as additional arguments, and all of them must evaluate to TRUE for an entry to be kept.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=FILTER(A1:C1, A2:C2)', '=FILTER(A1:A5, A1:A5>10)', '=FILTER(A1:C1, A2:C2, A3:C3)'],
  },
  FORMULATEXT: {
    category: 'Lookup and reference',
    shortDescription: 'Returns a formula in a given cell as a string.',
    parameters: [{name: 'reference', description: 'The cell reference whose formula is returned as text.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=FORMULATEXT(A1)', '=FORMULATEXT(Sheet2!B2)'],
  },
  HLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches horizontally with reference to adjacent cells to the bottom.',
    parameters: [{name: 'search_criterion', description: 'The value to search for in the first row of array.'}, {name: 'array', description: 'The range to search, with values compared against its first row.'}, {name: 'index', description: 'The row number within array (counting from 1) whose value in the matching column is returned.'}, {name: 'sort_order', description: 'TRUE (default) performs an approximate match against ascending-sorted data, FALSE performs an exact match.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HLOOKUP("apple", A1:D5, 3, FALSE())', '=HLOOKUP(5, A1:F2, 2)'],
  },
  HSTACK: {
    category: 'Lookup and reference',
    shortDescription: 'Stacks arrays horizontally into a single array.',
    parameters: [{name: 'array1', description: 'A range or array to stack. Further ranges or arrays can be passed as additional arguments; they are stacked left to right into one array.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HSTACK(A1:A3, B1:B3)', '=HSTACK(A1:B2, C1:D2)'],
  },
  HYPERLINK: {
    category: 'Lookup and reference',
    shortDescription: 'Stores the url in the cell\'s metadata. It can be read using method [`getCellHyperlink`](https://hyperformula.handsontable.com/docs/api/classes/hyperformula.html#getcellhyperlink)',
    parameters: [{name: 'url', description: 'The URL stored in the cell\'s metadata, readable via getCellHyperlink.'}, {name: 'link_label', description: 'The text displayed in the cell. When omitted, url is displayed instead.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=HYPERLINK("https://hyperformula.handsontable.com")', '=HYPERLINK("https://hyperformula.handsontable.com", "HyperFormula docs")'],
  },
  INDEX: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the contents of a cell specified by row and column number. The column number is optional and defaults to 1.',
    parameters: [{name: 'range', description: 'The range from which a value is returned.'}, {name: 'row', description: 'The row number within range (counting from 1) of the value to return.'}, {name: 'column', description: 'The column number within range (counting from 1) of the value to return. Defaults to 1 when omitted.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=INDEX(A1:C10, 2, 3)', '=INDEX(A1:A10, 5)'],
  },
  MATCH: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the relative position of an item in an array that matches a specified value.',
    parameters: [{name: 'search_criterion', description: 'The value to search for in lookup_array.'}, {name: 'lookup_array', description: 'The single row or column of cells to search.'}, {name: 'match_type', description: '1 (default) finds the largest value less than or equal to search_criterion in ascending-sorted data, -1 finds the smallest value greater than or equal to it in descending-sorted data, and 0 finds an exact match.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MATCH(5, A1:A10, 0)', '=MATCH("apple", B1:B10)'],
  },
  // OFFSET is a protected function (parse-time transformed into a cell/range reference, so it has no plugin or
  // implementation metadata; see `FunctionRegistry._protectedPlugins`). Its structural metadata (parameter
  // optionality, repeatLastArgs) is authored separately in `PROTECTED_FUNCTION_METADATA`.
  OFFSET: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the value of a cell offset by a certain number of rows and columns from a given reference point.',
    parameters: [{name: 'reference', description: 'The starting cell the offset is measured from.'}, {name: 'rows', description: 'The number of rows to shift down from reference; a negative value shifts up.'}, {name: 'columns', description: 'The number of columns to shift right from reference; a negative value shifts left.'}, {name: 'height', description: 'The number of rows of the returned range. Defaults to 1 (a single row).'}, {name: 'width', description: 'The number of columns of the returned range. Defaults to 1 (a single column).'}],
    // The height/width form resolves to a multi-cell range, which a single cell cannot hold (#VALUE!), so the
    // example wraps it in a range-consuming function to stay pasteable as written.
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=OFFSET(A1, 1, 2)', '=SUM(OFFSET(A1, 2, 0, 3, 1))'],
  },
  ROW: {
    category: 'Lookup and reference',
    shortDescription: 'Returns row number of a given reference or formula reference if argument not provided.',
    parameters: [{name: 'reference', description: 'A cell reference whose row number is returned. When omitted, returns the row number of the cell containing the formula.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=ROW(B5)', '=ROW()'],
  },
  ROWS: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the number of rows in the given reference.',
    parameters: [{name: 'array', description: 'The range whose number of rows is counted.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=ROWS(A1:C5)', '=ROWS(A1:A9)'],
  },
  SORT: {
    category: 'Lookup and reference',
    shortDescription: 'Sorts the rows or columns of an array.',
    parameters: [{name: 'array', description: 'The range or array whose rows (or columns) are sorted.'}, {name: 'sort_index', description: 'The 1-based row or column index within array to sort by. Defaults to 1 (the first row or column).'}, {name: 'sort_order', description: '1 (default) sorts in ascending order; -1 sorts in descending order.'}, {name: 'by_col', description: 'FALSE (default) sorts the rows of array; TRUE sorts its columns.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=SORT(A1:A10)', '=SORT(A1:B10, 2, -1)'],
  },
  TAKE: {
    category: 'Lookup and reference',
    shortDescription: 'Returns specified rows or columns from the beginning or end of an array.',
    parameters: [{name: 'array', description: 'The array or range from which to take rows or columns.'}, {name: 'rows', description: 'The number of rows to take; a negative value takes rows from the end. An empty argument keeps all rows.'}, {name: 'columns', description: 'The number of columns to take; a negative value takes columns from the end. When omitted or empty, all columns are kept.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=TAKE(A1:C5, 2)', '=TAKE(A1:C5, -2, -1)', '=TAKE(A1:C5, , 2)'],
  },
  TRANSPOSE: {
    category: 'Lookup and reference',
    shortDescription: 'Transposes the rows and columns of an array.',
    parameters: [{name: 'array', description: 'The range of cells whose rows and columns are swapped in the returned array.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=TRANSPOSE(A1:C2)', '=TRANSPOSE(A1:A5)'],
  },
  UNIQUE: {
    category: 'Lookup and reference',
    shortDescription: 'Returns the unique rows or columns of an array.',
    parameters: [{name: 'array', description: 'The range or array to return distinct entries from.'}, {name: 'by_col', description: 'FALSE (default) compares and returns rows; TRUE compares and returns columns.'}, {name: 'exactly_once', description: 'FALSE (default) returns every distinct entry once; TRUE returns only the entries that appear exactly once in array.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=UNIQUE(A1:A10)', '=UNIQUE(A1:B10)'],
  },
  VLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches vertically with reference to adjacent cells to the right.',
    parameters: [{name: 'search_criterion', description: 'The value to search for in the first column of array.'}, {name: 'array', description: 'The range to search, with values compared against its first column.'}, {name: 'index', description: 'The column number within array (counting from 1) whose value in the matching row is returned.'}, {name: 'sort_order', description: 'TRUE (default) performs an approximate match against ascending-sorted data, FALSE performs an exact match.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=VLOOKUP("apple", A1:B10, 2, FALSE())', '=VLOOKUP(5, A1:C10, 3)'],
  },
  VSTACK: {
    category: 'Lookup and reference',
    shortDescription: 'Stacks arrays vertically into a single array.',
    parameters: [{name: 'array1', description: 'A range or array to stack. Further ranges or arrays can be passed as additional arguments; they are stacked top to bottom into one array.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=VSTACK(A1:B2, A3:B4)', '=VSTACK(A1:C1, A2:C2)'],
  },
  XLOOKUP: {
    category: 'Lookup and reference',
    shortDescription: 'Searches for a key in a range and returns the item corresponding to the match it finds. If no match exists, then XLOOKUP can return the closest (approximate) match.',
    parameters: [{name: 'lookup_value', description: 'The value to search for in lookup_array.'}, {name: 'lookup_array', description: 'The single row or column of cells to search.'}, {name: 'return_array', description: 'The range that values are returned from once a match is found; it must align in size with lookup_array.'}, {name: 'if_not_found', description: 'The value returned when no match is found. Defaults to the #N/A error.'}, {name: 'match_mode', description: '0 (default) for an exact match, -1 for an exact match or the next smaller item, 1 for an exact match or the next larger item, or 2 for a wildcard match.'}, {name: 'search_mode', description: '1 (default) searches from first to last, -1 searches from last to first, and 2 or -2 perform a binary search on ascending- or descending-sorted data respectively.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=XLOOKUP("apple", A1:A10, B1:B10)', '=XLOOKUP(5, A1:A10, B1:B10, "not found")'],
  },
}
