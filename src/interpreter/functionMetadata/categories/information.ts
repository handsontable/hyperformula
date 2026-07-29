/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Information" category. Authored here: this catalogue is the source of truth for the
 * function metadata API, and `docs/guide/built-in-functions.md` is generated from it. Includes the protected
 * `VERSION` function, whose structural metadata lives in `protectedFunctionMetadata.ts` rather than in a plugin.
 */
export const INFORMATION_DOCS: Record<string, FunctionDoc> = {
  ISBINARY: {
    category: 'Information',
    shortDescription: 'Returns TRUE if provided value is a valid binary number.',
    parameters: [{name: 'value', description: 'The value to test, coerced to a string and checked for containing only the digits 0 and 1 (up to 10 characters).'}],
    examples: ['=ISBINARY("1010")', '=ISBINARY(1001)', '=ISBINARY("2")'],
  },
  ISBLANK: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the reference to a cell is blank.',
    parameters: [{name: 'value', description: 'The value or cell reference to test; returns TRUE only for a genuinely empty cell, not for a cell holding an empty string or another value.'}],
    examples: ['=ISBLANK(A1)', '=ISBLANK("")'],
  },
  ISERR: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is error value except #N/A!.',
    parameters: [{name: 'value', description: 'The value or expression to test; returns TRUE for any error except #N/A.'}],
    examples: ['=ISERR(1/0)', '=ISERR(NA())'],
  },
  ISERROR: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is general error value.',
    parameters: [{name: 'value', description: 'The value or expression to test; returns TRUE for any error value, including #N/A.'}],
    examples: ['=ISERROR(1/0)', '=ISERROR(NA())'],
  },
  ISEVEN: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is an even integer, or FALSE if the value is odd.',
    parameters: [{name: 'value', description: 'The number to test; it is checked by its remainder without truncation, so a fractional value may return FALSE for both ISEVEN and ISODD.'}],
    examples: ['=ISEVEN(4)', '=ISEVEN(A1)'],
  },
  ISFORMULA: {
    category: 'Information',
    shortDescription: 'Checks whether referenced cell is a formula.',
    parameters: [{name: 'value', description: 'A cell or range reference to check; passing a non-reference expression instead returns the #N/A error.'}],
    examples: ['=ISFORMULA(A1)', '=ISFORMULA(B1:B3)'],
  },
  ISLOGICAL: {
    category: 'Information',
    shortDescription: 'Tests for a logical value (TRUE or FALSE).',
    parameters: [{name: 'value', description: 'The value to test; returns TRUE only when the value is the logical TRUE or FALSE.'}],
    examples: ['=ISLOGICAL(TRUE())', '=ISLOGICAL(1<2)', '=ISLOGICAL(1)'],
  },
  ISNA: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is #N/A! error.',
    parameters: [{name: 'value', description: 'The value or expression to test; returns TRUE only for the #N/A error.'}],
    examples: ['=ISNA(NA())', '=ISNA(1/0)'],
  },
  ISNONTEXT: {
    category: 'Information',
    shortDescription: 'Tests if the cell contents are text or numbers, and returns FALSE if the contents are text.',
    parameters: [{name: 'value', description: 'The value to test; returns FALSE only when the value is text, and TRUE for numbers, logical values, errors, and blank cells.'}],
    examples: ['=ISNONTEXT(A1)', '=ISNONTEXT("abc")'],
  },
  ISNUMBER: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value refers to a number.',
    parameters: [{name: 'value', description: 'The value to test; returns TRUE only when the value is a number.'}],
    examples: ['=ISNUMBER(1+1)', '=ISNUMBER("abc")'],
  },
  ISODD: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the value is odd, or FALSE if the number is even.',
    parameters: [{name: 'value', description: 'The number to test; it is checked by its remainder without truncation, so a fractional value may return FALSE for both ISODD and ISEVEN.'}],
    examples: ['=ISODD(3)', '=ISODD(A1)'],
  },
  ISREF: {
    category: 'Information',
    shortDescription: 'Returns TRUE if provided value is #REF! error.',
    parameters: [{name: 'value', description: 'The value or expression to test; returns TRUE only when it evaluates to a #REF! (or #CYCLE!) error, not merely because it looks like a reference.'}],
    examples: ['=ISREF(A1)', '=ISREF(OFFSET(A1, -1, 0))'],
  },
  ISTEXT: {
    category: 'Information',
    shortDescription: 'Returns TRUE if the cell contents reference text.',
    parameters: [{name: 'value', description: 'The value to test; returns TRUE only when the value is text.'}],
    examples: ['=ISTEXT("abc")', '=ISTEXT(A1)'],
  },
  NA: {
    category: 'Information',
    shortDescription: 'Returns #N/A! error value.',
    parameters: [],
    examples: ['=NA()'],
  },
  SHEET: {
    category: 'Information',
    shortDescription: 'Returns sheet number of a given value or a formula sheet number if no argument is provided.',
    parameters: [{name: 'value', description: 'An optional sheet name (as text) or a cell/range reference identifying the sheet to look up; when omitted, returns the number of the sheet containing the formula.'}],
    examples: ['=SHEET()', '=SHEET(A1)', '=SHEET("Sheet2")'],
  },
  SHEETS: {
    category: 'Information',
    shortDescription: 'Returns number of sheet of a given reference or number of all sheets in workbook when no argument is provided.',
    parameters: [{name: 'value', description: 'An optional cell or range reference; when omitted, returns the total number of sheets in the workbook, otherwise returns 1 for the sheet containing the reference.'}],
    examples: ['=SHEETS()', '=SHEETS(A1:B3)'],
  },
  // VERSION is a protected function (its plugin, VersionPlugin, is kept out of the general registry so it can
  // never be unregistered; see `FunctionRegistry._protectedPlugins`). Its structural metadata (parameters,
  // repeatLastArgs) is authored separately in `PROTECTED_FUNCTION_METADATA`.
  VERSION: {
    category: 'Information',
    shortDescription: 'Returns the HyperFormula version and the license key status as a single text value, e.g. "HyperFormula v3.0.0, 1" (a status code, or the last five characters of the license key).',
    parameters: [],
    examples: ['=VERSION()'],
  },
}
