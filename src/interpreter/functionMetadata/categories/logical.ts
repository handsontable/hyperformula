/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Logical" category. Authored here: this catalogue is the source of
 * truth for the function metadata API, and `docs/guide/built-in-functions.md` is generated from it.
 */
export const LOGICAL_DOCS: Record<string, FunctionDoc> = {
  AND: {
    category: 'Logical',
    shortDescription: 'Returns TRUE if all arguments are TRUE.',
    parameters: [{name: 'logical_value1', description: 'A logical value, expression, or range to test. Further logical values can be passed as additional arguments; the result is TRUE only if all of them are TRUE.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=AND(TRUE(), TRUE())', '=AND(A1>0, A2>0)', '=AND(A1:A5)'],
  },
  FALSE: {
    category: 'Logical',
    shortDescription: 'Returns the logical value FALSE.',
    parameters: [],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=FALSE()'],
  },
  IF: {
    category: 'Logical',
    shortDescription: 'Specifies a logical test to be performed.',
    parameters: [{name: 'test', description: 'The logical expression or value to evaluate.'}, {name: 'then_value', description: 'The value returned when test evaluates to TRUE.'}, {name: 'otherwise_value', description: 'The value returned when test evaluates to FALSE. When omitted, FALSE is returned instead.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=IF(A1>10, "big", "small")', '=IF(B1="", "empty", B1)'],
  },
  IFERROR: {
    category: 'Logical',
    shortDescription: 'Returns the value if the cell does not contains an error value, or the alternative value if it does.',
    parameters: [{name: 'value', description: 'The value or formula checked for an error.'}, {name: 'alternate_value', description: 'The value returned when value evaluates to any error; otherwise value itself is returned.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=IFERROR(A1/B1, "error")', '=IFERROR(VLOOKUP(A1, B1:C10, 2, FALSE()), "not found")'],
  },
  IFNA: {
    category: 'Logical',
    shortDescription: 'Returns the value if the cell does not contains the #N/A (value not available) error value, or the alternative value if it does.',
    parameters: [{name: 'value', description: 'The value or formula checked for the #N/A error.'}, {name: 'alternate_value', description: 'The value returned when value evaluates to #N/A; other error types and non-error values are returned unchanged.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=IFNA(VLOOKUP(A1, B1:C10, 2, FALSE()), "not found")', '=IFNA(A1, "n/a")'],
  },
  IFS: {
    category: 'Logical',
    shortDescription: 'Evaluates multiple logical tests and returns a value that corresponds to the first true condition.',
    parameters: [{name: 'condition1', description: 'A logical test to evaluate. Further condition/value pairs can be passed as additional arguments and are checked in order.'}, {name: 'value1', description: 'The value returned when the preceding condition is the first one to evaluate to TRUE. Further condition/value pairs can be passed as additional arguments.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=IFS(A1>90, "A", A1>80, "B")', '=IFS(A1<0, "negative", A1=0, "zero", A1>0, "positive")'],
  },
  NOT: {
    category: 'Logical',
    shortDescription: 'Complements (inverts) logical_value.',
    parameters: [{name: 'logical_value', description: 'The logical value or expression to invert: TRUE becomes FALSE and vice versa.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=NOT(TRUE())', '=NOT(A1>10)'],
  },
  OR: {
    category: 'Logical',
    shortDescription: 'Returns TRUE if at least one argument is TRUE.',
    parameters: [{name: 'logical_value1', description: 'A logical value, expression, or range to test. Further logical values can be passed as additional arguments; the result is TRUE if any of them is TRUE.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=OR(TRUE(), FALSE())', '=OR(A1>10, A2>10)', '=OR(A1:A5)'],
  },
  SWITCH: {
    category: 'Logical',
    shortDescription: 'Compares expression against value1, value2, ... in order and returns the paired result1, result2, ...; a candidate value that is an error is skipped rather than matched.',
    parameters: [{name: 'expression', description: 'The expression or value compared against the candidate values that follow.'}, {name: 'value1', description: 'The first candidate value compared to expression; an error value is skipped rather than compared.'}, {name: 'result1', description: 'The value returned when value1 matches expression. Further value/result pairs can be passed as additional arguments, and a final unpaired argument is returned as the default when no candidate matches; without one, an unmatched expression returns #N/A.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=SWITCH(A1, 1, "one", 2, "two", "other")', '=SWITCH(WEEKDAY(A1), 1, "Sunday", 7, "Saturday", "weekday")'],
  },
  TRUE: {
    category: 'Logical',
    shortDescription: 'Returns the logical value TRUE.',
    parameters: [],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=TRUE()'],
  },
  XOR: {
    category: 'Logical',
    shortDescription: 'Returns true if an odd number of arguments evaluates to TRUE.',
    parameters: [{name: 'logical_value1', description: 'A logical value, expression, or range to test. Further logical values can be passed as additional arguments; the result is TRUE when an odd number of them are TRUE.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=XOR(TRUE(), FALSE())', '=XOR(A1>0, A2>0)'],
  },
}
