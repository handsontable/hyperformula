/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Text" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const TEXT_DOCS: Record<string, FunctionDoc> = {
  CHAR: {
    category: 'Text',
    shortDescription: 'Converts a number into a character according to the current code table.',
    parameters: [{name: 'number', description: ''}],
  },
  CLEAN: {
    category: 'Text',
    shortDescription: 'Returns text that has been "cleaned" of line breaks and other non-printable characters.',
    parameters: [{name: 'text', description: ''}],
  },
  CODE: {
    category: 'Text',
    shortDescription: 'Returns a numeric code for the first character in a text string.',
    parameters: [{name: 'text', description: ''}],
  },
  CONCATENATE: {
    category: 'Text',
    shortDescription: 'Combines several text strings into one string.',
    parameters: [{name: 'text1', description: ''}],
  },
  EXACT: {
    category: 'Text',
    shortDescription: 'Returns TRUE if both text strings are exactly the same.',
    parameters: [{name: 'text1', description: ''}, {name: 'text2', description: ''}],
  },
  FIND: {
    category: 'Text',
    shortDescription: 'Returns the location of one text string inside another.',
    parameters: [{name: 'text1', description: ''}, {name: 'text2', description: ''}, {name: 'number', description: ''}],
  },
  LEFT: {
    category: 'Text',
    shortDescription: 'Extracts a given number of characters from the left side of a text string.',
    parameters: [{name: 'text', description: ''}, {name: 'number', description: ''}],
  },
  LEN: {
    category: 'Text',
    shortDescription: 'Returns length of a given text.',
    parameters: [{name: 'text', description: ''}],
  },
  LOWER: {
    category: 'Text',
    shortDescription: 'Returns text converted to lowercase.',
    parameters: [{name: 'text', description: ''}],
  },
  MID: {
    category: 'Text',
    shortDescription: 'Returns substring of a given length starting from Start_position.',
    parameters: [{name: 'text', description: ''}, {name: 'start_position', description: ''}, {name: 'length', description: ''}],
  },
  N: {
    category: 'Text',
    shortDescription: 'Converts a value to a number.',
    parameters: [{name: 'value', description: ''}],
  },
  PROPER: {
    category: 'Text',
    shortDescription: 'Capitalizes words given text string.',
    parameters: [{name: 'text', description: ''}],
  },
  REPLACE: {
    category: 'Text',
    shortDescription: 'Replaces substring of a text of a given length that starts at given position.',
    parameters: [{name: 'text', description: ''}, {name: 'start_position', description: ''}, {name: 'length', description: ''}, {name: 'new_text', description: ''}],
  },
  REPT: {
    category: 'Text',
    shortDescription: 'Repeats text a given number of times.',
    parameters: [{name: 'text', description: ''}, {name: 'number', description: ''}],
  },
  RIGHT: {
    category: 'Text',
    shortDescription: 'Extracts a given number of characters from the right side of a text string.',
    parameters: [{name: 'text', description: ''}, {name: 'number', description: ''}],
  },
  SEARCH: {
    category: 'Text',
    shortDescription: 'Returns the location of Search_string inside Text. Case-insensitive. Allows the use of wildcards.',
    parameters: [{name: 'search_string', description: ''}, {name: 'text', description: ''}, {name: 'start_position', description: ''}],
  },
  SPLIT: {
    category: 'Text',
    shortDescription: 'Divides the provided text using the space character as a separator and returns the substring at the zero-based position specified by the second argument.<br>`SPLIT("Lorem ipsum", 0) -> "Lorem"`<br>`SPLIT("Lorem ipsum", 1) -> "ipsum"`',
    parameters: [{name: 'text', description: ''}, {name: 'index', description: ''}],
  },
  SUBSTITUTE: {
    category: 'Text',
    shortDescription: 'Returns string where occurrences of Old_text are replaced by New_text. Replaces only specific occurrence if last parameter is provided.',
    parameters: [{name: 'text', description: ''}, {name: 'old_text', description: ''}, {name: 'new_text', description: ''}, {name: 'occurrence', description: ''}],
  },
  T: {
    category: 'Text',
    shortDescription: 'Returns text if given value is text, empty string otherwise.',
    parameters: [{name: 'value', description: ''}],
  },
  TEXT: {
    category: 'Text',
    shortDescription: 'Converts a number into text according to a given format.<br>By default, accepts the same formats that can be passed to the [`dateFormats`](../api/interfaces/configparams.md#dateformats) option, but can be further customized with the [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime) option.',
    parameters: [{name: 'number', description: ''}, {name: 'format', description: ''}],
  },
  TEXTJOIN: {
    category: 'Text',
    shortDescription: 'Joins text from multiple strings and/or ranges with a delimiter. Supports array/range delimiters that cycle through gaps. When ignore_empty is TRUE, empty strings are skipped. Returns #VALUE! if result exceeds 32,767 characters.',
    parameters: [{name: 'delimiter', description: ''}, {name: 'ignore_empty', description: ''}, {name: 'text1', description: ''}],
  },
  TRIM: {
    category: 'Text',
    shortDescription: 'Strips extra spaces from text.',
    parameters: [{name: 'text', description: ''}],
  },
  UNICHAR: {
    category: 'Text',
    shortDescription: 'Returns the character created by using provided code point.',
    parameters: [{name: 'number', description: ''}],
  },
  UNICODE: {
    category: 'Text',
    shortDescription: 'Returns the Unicode code point of a first character of a text.',
    parameters: [{name: 'text', description: ''}],
  },
  UPPER: {
    category: 'Text',
    shortDescription: 'Returns text converted to uppercase.',
    parameters: [{name: 'text', description: ''}],
  },
  VALUE: {
    category: 'Text',
    shortDescription: 'Parses a number, date, time, datetime, currency, or percentage from a text string.',
    parameters: [{name: 'text', description: ''}],
  },
}
