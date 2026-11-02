/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Text" category. Authored here: this catalogue is the source of
 * truth for the function metadata API, and `docs/guide/built-in-functions.md` is generated from it.
 */
export const TEXT_DOCS: Record<string, FunctionDoc> = {
  CHAR: {
    category: 'Text',
    shortDescription: 'Converts a number into a character according to the current code table.',
    parameters: [{name: 'number', description: 'A code between 1 and 255 that identifies the character to return.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=CHAR(65)', '=CHAR(97)'],
  },
  CLEAN: {
    category: 'Text',
    shortDescription: 'Returns text that has been "cleaned" of line breaks and other non-printable characters.',
    parameters: [{name: 'text', description: 'The text to strip of non-printable characters.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=CLEAN(A1)', '=CLEAN("Hello"&CHAR(10)&"World")'],
  },
  CODE: {
    category: 'Text',
    shortDescription: 'Returns a numeric code for the first character in a text string.',
    parameters: [{name: 'text', description: 'The text whose first character\'s numeric code is returned.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=CODE("A")', '=CODE(A1)'],
  },
  CONCATENATE: {
    category: 'Text',
    shortDescription: 'Combines several text strings into one string.',
    parameters: [{name: 'text1', description: 'A text value, cell reference, or range to include in the joined string. Further text values or ranges can be passed as additional arguments and are appended in order.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=CONCATENATE("Hello", " ", "World")', '=CONCATENATE(A1, A2, A3)'],
  },
  EXACT: {
    category: 'Text',
    shortDescription: 'Returns TRUE if both text strings are exactly the same.',
    parameters: [{name: 'text1', description: 'The first text value to compare.'}, {name: 'text2', description: 'The second text value to compare, matched case-sensitively against text1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=EXACT("Apple", "apple")', '=EXACT(A1, B1)'],
  },
  FIND: {
    category: 'Text',
    shortDescription: 'Returns the location of one text string inside another.',
    parameters: [{name: 'search_string', description: 'The text to search for. The search is case-sensitive.'}, {name: 'text', description: 'The text to search within.'}, {name: 'start_position', description: 'The 1-based character position in text at which to start searching. Defaults to 1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=FIND("o", "Hello World")', '=FIND("o", "Hello World", 6)'],
  },
  LEFT: {
    category: 'Text',
    shortDescription: 'Extracts a given number of characters from the left side of a text string.',
    parameters: [{name: 'text', description: 'The text to extract characters from.'}, {name: 'number', description: 'The number of characters to extract, counting from the left. Defaults to 1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=LEFT("Hello", 2)', '=LEFT(A1)'],
  },
  LEN: {
    category: 'Text',
    shortDescription: 'Returns length of a given text.',
    parameters: [{name: 'text', description: 'The text whose number of characters is counted.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=LEN("Hello")', '=LEN(A1)'],
  },
  LOWER: {
    category: 'Text',
    shortDescription: 'Returns text converted to lowercase.',
    parameters: [{name: 'text', description: 'The text to convert to lowercase.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=LOWER("HELLO")', '=LOWER(A1)'],
  },
  MID: {
    category: 'Text',
    shortDescription: 'Returns a substring of a given length starting from start_position.',
    parameters: [{name: 'text', description: 'The text to extract a substring from.'}, {name: 'start_position', description: 'The 1-based position of the first character to extract.'}, {name: 'length', description: 'The number of characters to extract, starting at start_position.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=MID("Hello World", 7, 5)', '=MID(A1, 1, 3)'],
  },
  PROPER: {
    category: 'Text',
    shortDescription: 'Capitalizes words given text string.',
    parameters: [{name: 'text', description: 'The text whose words are capitalized, with the first letter of each word converted to uppercase and the rest to lowercase.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=PROPER("hello world")', '=PROPER(A1)'],
  },
  REPLACE: {
    category: 'Text',
    shortDescription: 'Replaces substring of a text of a given length that starts at given position.',
    parameters: [{name: 'text', description: 'The text in which characters are replaced.'}, {name: 'start_position', description: 'The 1-based position of the first character to replace.'}, {name: 'length', description: 'The number of characters to replace, starting at start_position.'}, {name: 'new_text', description: 'The text that replaces the removed characters.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=REPLACE("Hello World", 7, 5, "There")', '=REPLACE(A1, 1, 3, "New")'],
  },
  REPT: {
    category: 'Text',
    shortDescription: 'Repeats text a given number of times.',
    parameters: [{name: 'text', description: 'The text to repeat.'}, {name: 'number', description: 'The number of times to repeat text.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=REPT("ab", 3)', '=REPT(A1, 2)'],
  },
  RIGHT: {
    category: 'Text',
    shortDescription: 'Extracts a given number of characters from the right side of a text string.',
    parameters: [{name: 'text', description: 'The text to extract characters from.'}, {name: 'number', description: 'The number of characters to extract, counting from the right. Defaults to 1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=RIGHT("Hello", 2)', '=RIGHT(A1)'],
  },
  SEARCH: {
    category: 'Text',
    shortDescription: 'Returns the location of search_string inside text. Case-insensitive. Allows the use of wildcards.',
    parameters: [{name: 'search_string', description: 'The text to search for. The search is case-insensitive and may contain "?" and "*" wildcards.'}, {name: 'text', description: 'The text to search within.'}, {name: 'start_position', description: 'The 1-based character position in text at which to start searching. Defaults to 1.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=SEARCH("o", "Hello World")', '=SEARCH("w*d", "Hello World")'],
  },
  SPLIT: {
    category: 'Text',
    shortDescription: 'Divides the provided text using the space character as a separator and returns the substring at the zero-based position specified by the second argument. For example, SPLIT("Lorem ipsum", 0) returns "Lorem" and SPLIT("Lorem ipsum", 1) returns "ipsum".',
    parameters: [{name: 'text', description: 'The text to split on the space character.'}, {name: 'index', description: 'The zero-based position of the chunk to return after splitting.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=SPLIT("Lorem ipsum", 0)', '=SPLIT(A1, 1)'],
  },
  SUBSTITUTE: {
    category: 'Text',
    shortDescription: 'Returns a string where occurrences of old_text are replaced by new_text. Replaces only specific occurrence if last parameter is provided.',
    parameters: [{name: 'text', description: 'The text in which occurrences of old_text are replaced.'}, {name: 'old_text', description: 'The text to search for and replace.'}, {name: 'new_text', description: 'The text that replaces each matched occurrence of old_text.'}, {name: 'occurrence', description: 'The 1-based occurrence of old_text to replace. When omitted, every occurrence is replaced.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=SUBSTITUTE("a-b-c", "-", ":")', '=SUBSTITUTE("a-b-c", "-", ":", 2)'],
  },
  T: {
    category: 'Text',
    shortDescription: 'Returns text if given value is text, empty string otherwise.',
    parameters: [{name: 'value', description: 'The value to check; returned unchanged if it is text, otherwise an empty string is returned.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=T("Hello")', '=T(A1)', '=T(123)'],
  },
  TEXT: {
    category: 'Text',
    shortDescription: 'Converts a number into text according to a given format. By default it accepts the same formats as the [`dateFormats`](https://hyperformula.handsontable.com/docs/api/interfaces/configparams.html#dateformats) option, and can be further customized with the [`stringifyDateTime`](https://hyperformula.handsontable.com/docs/api/interfaces/configparams.html#stringifydatetime) and [`stringifyCurrency`](https://hyperformula.handsontable.com/docs/api/interfaces/configparams.html#stringifycurrency) options.',
    parameters: [{name: 'number', description: 'The number or date serial value to format as text.'}, {name: 'format', description: 'The format pattern used to render number as text, e.g. "0.00" or "YYYY-MM-DD".'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=TEXT(1234.5, "0.00")', '=TEXT(TODAY(), "YYYY-MM-DD")'],
  },
  TEXTJOIN: {
    category: 'Text',
    shortDescription: 'Joins text from multiple strings and/or ranges with a delimiter. Supports array/range delimiters that cycle through gaps. When ignore_empty is TRUE, empty strings are skipped. Returns #VALUE! if result exceeds 32,767 characters.',
    parameters: [{name: 'delimiter', description: 'The text (or range/array of texts, cycled through the gaps) inserted between joined values.'}, {name: 'ignore_empty', description: 'When TRUE, empty strings among the joined values are skipped instead of producing an extra delimiter.'}, {name: 'text1', description: 'A text value, cell reference, or range to join. Further text values or ranges can be passed as additional arguments and are appended in order.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=TEXTJOIN(", ", TRUE(), A1:A3)', '=TEXTJOIN("-", FALSE(), "a", "b", "c")'],
  },
  TRIM: {
    category: 'Text',
    shortDescription: 'Strips extra spaces from text.',
    parameters: [{name: 'text', description: 'The text to strip of leading, trailing, and repeated inner spaces.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=TRIM("  Hello   World  ")', '=TRIM(A1)'],
  },
  UNICHAR: {
    category: 'Text',
    shortDescription: 'Returns the character created by using provided code point.',
    parameters: [{name: 'number', description: 'The Unicode code point that identifies the character to return.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=UNICHAR(65)', '=UNICHAR(8364)'],
  },
  UNICODE: {
    category: 'Text',
    shortDescription: 'Returns the Unicode code point of a first character of a text.',
    parameters: [{name: 'text', description: 'The text whose first character\'s Unicode code point is returned.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=UNICODE("A")', '=UNICODE(A1)'],
  },
  UPPER: {
    category: 'Text',
    shortDescription: 'Returns text converted to uppercase.',
    parameters: [{name: 'text', description: 'The text to convert to uppercase.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=UPPER("hello")', '=UPPER(A1)'],
  },
  VALUE: {
    category: 'Text',
    shortDescription: 'Parses a number, date, time, datetime, currency, or percentage from a text string.',
    parameters: [{name: 'text', description: 'The text to parse as a number, date, time, datetime, currency, or percentage.'}],
    documentationUrl: 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html',
    examples: ['=VALUE("123")', '=VALUE("50%")', '=VALUE(A1)'],
  },
}
