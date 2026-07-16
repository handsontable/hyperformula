/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Text" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const TEXT_DOCS: Record<string, FunctionDoc> = {
  CHAR: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Converts a number into a character according to the current code table.',
    parameters: [{name: 'number', description: 'A code between 1 and 255 that identifies the character to return.'}],
    examples: ['=CHAR(65)', '=CHAR(97)'],
  },
  CLEAN: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns text that has been "cleaned" of line breaks and other non-printable characters.',
    parameters: [{name: 'text', description: 'The text to strip of non-printable characters.'}],
    examples: ['=CLEAN(A1)', '=CLEAN("Hello"&CHAR(10)&"World")'],
  },
  CODE: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns a numeric code for the first character in a text string.',
    parameters: [{name: 'text', description: 'The text whose first character\'s numeric code is returned.'}],
    examples: ['=CODE("A")', '=CODE(A1)'],
  },
  CONCATENATE: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Combines several text strings into one string.',
    parameters: [{name: 'text1', description: 'A text value, cell reference, or range to include in the joined string. Further text values or ranges can be passed as additional arguments and are appended in order.'}],
    examples: ['=CONCATENATE("Hello", " ", "World")', '=CONCATENATE(A1, A2, A3)'],
  },
  EXACT: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns TRUE if both text strings are exactly the same.',
    parameters: [{name: 'text1', description: 'The first text value to compare.'}, {name: 'text2', description: 'The second text value to compare, matched case-sensitively against Text1.'}],
    examples: ['=EXACT("Apple", "apple")', '=EXACT(A1, B1)'],
  },
  FIND: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the location of one text string inside another.',
    parameters: [{name: 'text1', description: 'The text to search for. The search is case-sensitive.'}, {name: 'text2', description: 'The text to search within.'}, {name: 'number', description: 'The 1-based character position in Text2 at which to start searching. Defaults to 1.'}],
    examples: ['=FIND("o", "Hello World")', '=FIND("o", "Hello World", 6)'],
  },
  LEFT: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Extracts a given number of characters from the left side of a text string.',
    parameters: [{name: 'text', description: 'The text to extract characters from.'}, {name: 'number', description: 'The number of characters to extract, counting from the left. Defaults to 1.'}],
    examples: ['=LEFT("Hello", 2)', '=LEFT(A1)'],
  },
  LEN: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns length of a given text.',
    parameters: [{name: 'text', description: 'The text whose number of characters is counted.'}],
    examples: ['=LEN("Hello")', '=LEN(A1)'],
  },
  LOWER: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns text converted to lowercase.',
    parameters: [{name: 'text', description: 'The text to convert to lowercase.'}],
    examples: ['=LOWER("HELLO")', '=LOWER(A1)'],
  },
  MID: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns substring of a given length starting from Start_position.',
    parameters: [{name: 'text', description: 'The text to extract a substring from.'}, {name: 'start_position', description: 'The 1-based position of the first character to extract.'}, {name: 'length', description: 'The number of characters to extract, starting at Start_position.'}],
    examples: ['=MID("Hello World", 7, 5)', '=MID(A1, 1, 3)'],
  },
  N: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Converts a value to a number.',
    parameters: [{name: 'value', description: 'The value to convert: numbers and dates return themselves, TRUE/FALSE return 1/0, and text or empty values return 0.'}],
    examples: ['=N(TRUE())', '=N("5")', '=N(A1)'],
  },
  PROPER: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Capitalizes words given text string.',
    parameters: [{name: 'text', description: 'The text whose words are capitalized, with the first letter of each word converted to uppercase and the rest to lowercase.'}],
    examples: ['=PROPER("hello world")', '=PROPER(A1)'],
  },
  REPLACE: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Replaces substring of a text of a given length that starts at given position.',
    parameters: [{name: 'text', description: 'The text in which characters are replaced.'}, {name: 'start_position', description: 'The 1-based position of the first character to replace.'}, {name: 'length', description: 'The number of characters to replace, starting at Start_position.'}, {name: 'new_text', description: 'The text that replaces the removed characters.'}],
    examples: ['=REPLACE("Hello World", 7, 5, "There")', '=REPLACE(A1, 1, 3, "New")'],
  },
  REPT: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Repeats text a given number of times.',
    parameters: [{name: 'text', description: 'The text to repeat.'}, {name: 'number', description: 'The number of times to repeat Text.'}],
    examples: ['=REPT("ab", 3)', '=REPT(A1, 2)'],
  },
  RIGHT: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Extracts a given number of characters from the right side of a text string.',
    parameters: [{name: 'text', description: 'The text to extract characters from.'}, {name: 'number', description: 'The number of characters to extract, counting from the right. Defaults to 1.'}],
    examples: ['=RIGHT("Hello", 2)', '=RIGHT(A1)'],
  },
  SEARCH: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the location of Search_string inside Text. Case-insensitive. Allows the use of wildcards.',
    parameters: [{name: 'search_string', description: 'The text to search for. The search is case-insensitive and may contain "?" and "*" wildcards.'}, {name: 'text', description: 'The text to search within.'}, {name: 'start_position', description: 'The 1-based character position in Text at which to start searching. Defaults to 1.'}],
    examples: ['=SEARCH("o", "Hello World")', '=SEARCH("w*d", "Hello World")'],
  },
  SPLIT: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Divides the provided text using the space character as a separator and returns the substring at the zero-based position specified by the second argument. For example, SPLIT("Lorem ipsum", 0) returns "Lorem" and SPLIT("Lorem ipsum", 1) returns "ipsum".',
    parameters: [{name: 'text', description: 'The text to split on the space character.'}, {name: 'index', description: 'The zero-based position of the chunk to return after splitting.'}],
    examples: ['=SPLIT("Lorem ipsum", 0)', '=SPLIT(A1, 1)'],
  },
  SUBSTITUTE: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns string where occurrences of Old_text are replaced by New_text. Replaces only specific occurrence if last parameter is provided.',
    parameters: [{name: 'text', description: 'The text in which occurrences of Old_text are replaced.'}, {name: 'old_text', description: 'The text to search for and replace.'}, {name: 'new_text', description: 'The text that replaces each matched occurrence of Old_text.'}, {name: 'occurrence', description: 'The 1-based occurrence of Old_text to replace. When omitted, every occurrence is replaced.'}],
    examples: ['=SUBSTITUTE("a-b-c", "-", ":")', '=SUBSTITUTE("a-b-c", "-", ":", 2)'],
  },
  T: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns text if given value is text, empty string otherwise.',
    parameters: [{name: 'value', description: 'The value to check; returned unchanged if it is text, otherwise an empty string is returned.'}],
    examples: ['=T("Hello")', '=T(A1)', '=T(123)'],
  },
  TEXT: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Converts a number into text according to a given format. By default it accepts the same formats as the dateFormats option, and can be further customized with the stringifyDateTime and stringifyCurrency options.',
    parameters: [{name: 'number', description: 'The number or date serial value to format as text.'}, {name: 'format', description: 'The format pattern used to render Number as text, e.g. "0.00" or "YYYY-MM-DD".'}],
    examples: ['=TEXT(1234.5, "0.00")', '=TEXT(TODAY(), "YYYY-MM-DD")'],
  },
  TEXTJOIN: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Joins text from multiple strings and/or ranges with a delimiter. Supports array/range delimiters that cycle through gaps. When ignore_empty is TRUE, empty strings are skipped. Returns #VALUE! if result exceeds 32,767 characters.',
    parameters: [{name: 'delimiter', description: 'The text (or range/array of texts, cycled through the gaps) inserted between joined values.'}, {name: 'ignore_empty', description: 'When TRUE, empty strings among the joined values are skipped instead of producing an extra delimiter.'}, {name: 'text1', description: 'A text value, cell reference, or range to join. Further text values or ranges can be passed as additional arguments and are appended in order.'}],
    examples: ['=TEXTJOIN(", ", TRUE(), A1:A3)', '=TEXTJOIN("-", FALSE(), "a", "b", "c")'],
  },
  TRIM: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Strips extra spaces from text.',
    parameters: [{name: 'text', description: 'The text to strip of leading, trailing, and repeated inner spaces.'}],
    examples: ['=TRIM("  Hello   World  ")', '=TRIM(A1)'],
  },
  UNICHAR: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the character created by using provided code point.',
    parameters: [{name: 'number', description: 'The Unicode code point that identifies the character to return.'}],
    examples: ['=UNICHAR(65)', '=UNICHAR(8364)'],
  },
  UNICODE: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns the Unicode code point of a first character of a text.',
    parameters: [{name: 'text', description: 'The text whose first character\'s Unicode code point is returned.'}],
    examples: ['=UNICODE("A")', '=UNICODE(A1)'],
  },
  UPPER: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Returns text converted to uppercase.',
    parameters: [{name: 'text', description: 'The text to convert to uppercase.'}],
    examples: ['=UPPER("hello")', '=UPPER(A1)'],
  },
  VALUE: {
    category: 'Text',
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    shortDescription: 'Parses a number, date, time, datetime, currency, or percentage from a text string.',
    parameters: [{name: 'text', description: 'The text to parse as a number, date, time, datetime, currency, or percentage.'}],
    examples: ['=VALUE("123")', '=VALUE("50%")', '=VALUE(A1)'],
  },
}
