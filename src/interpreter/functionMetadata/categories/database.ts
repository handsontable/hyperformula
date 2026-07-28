/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Database" category. Generated from `docs/guide/built-in-functions.md` by
 * a one-time migration script (since removed).
 */
export const DATABASE_DOCS: Record<string, FunctionDoc> = {
  DAVERAGE: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the average of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose values are averaged, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DAVERAGE(A1:C10, "Sales", E1:E2)', '=DAVERAGE(A1:C10, 3, E1:F2)'],
  },
  DCOUNT: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Counts the cells containing numbers in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose numeric values are counted, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DCOUNT(A1:C10, "Sales", E1:E2)', '=DCOUNT(A1:C10, 3, E1:F2)'],
  },
  DCOUNTA: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Counts the non-empty cells in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose non-empty values are counted, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DCOUNTA(A1:C10, "Name", E1:E2)', '=DCOUNTA(A1:C10, 1, E1:F2)'],
  },
  DGET: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the single value from a database field that matches the given criteria. Returns #VALUE! if no records match, and #NUM! if more than one record matches.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose value is returned, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DGET(A1:C10, "Name", E1:E2)', '=DGET(A1:C10, 2, E1:F2)'],
  },
  DMAX: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the maximum value in a database field that matches the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose maximum value is returned, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DMAX(A1:C10, "Sales", E1:E2)', '=DMAX(A1:C10, 3, E1:F2)'],
  },
  DMIN: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the minimum value in a database field that matches the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose minimum value is returned, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DMIN(A1:C10, "Sales", E1:E2)', '=DMIN(A1:C10, 3, E1:F2)'],
  },
  DPRODUCT: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the product of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose matching values are multiplied together, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DPRODUCT(A1:C10, "Sales", E1:E2)', '=DPRODUCT(A1:C10, 3, E1:F2)'],
  },
  DSTDEV: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the sample standard deviation of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose sample standard deviation is calculated, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DSTDEV(A1:C10, "Sales", E1:E2)', '=DSTDEV(A1:C10, 3, E1:F2)'],
  },
  DSTDEVP: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the population standard deviation of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose population standard deviation is calculated, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DSTDEVP(A1:C10, "Sales", E1:E2)', '=DSTDEVP(A1:C10, 3, E1:F2)'],
  },
  DSUM: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the sum of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose values are summed, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DSUM(A1:C10, "Sales", E1:E2)', '=DSUM(A1:C10, 3, E1:F2)'],
  },
  DVAR: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the sample variance of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose sample variance is calculated, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DVAR(A1:C10, "Sales", E1:E2)', '=DVAR(A1:C10, 3, E1:F2)'],
  },
  DVARP: {
    category: 'Database',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the population variance of all values in a database field that match the given criteria.',
    parameters: [{name: 'database', description: 'The range of cells holding the database table, including a header row with field names in the first row.'}, {name: 'field', description: 'The field whose population variance is calculated, given as a matching header name or as a 1-based column index within Database.'}, {name: 'criteria', description: 'The range of condition cells, with a header row matching field names in Database and one or more rows below it; conditions within the same row are combined with AND, and separate rows are combined with OR.'}],
    examples: ['=DVARP(A1:C10, "Sales", E1:E2)', '=DVARP(A1:C10, 3, E1:F2)'],
  },
}
