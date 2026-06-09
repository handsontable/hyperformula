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
    parameters: [{name: 'Number', description: ''}],
  },
  CLEAN: {
    category: 'Text',
    shortDescription: 'Returns text that has been "cleaned" of line breaks and other non-printable characters.',
    parameters: [{name: 'Text', description: ''}],
  },
  CODE: {
    category: 'Text',
    shortDescription: 'Returns a numeric code for the first character in a text string.',
    parameters: [{name: 'Text', description: ''}],
  },
  CONCATENATE: {
    category: 'Text',
    shortDescription: 'Combines several text strings into one string.',
    parameters: [{name: 'Text1', description: ''}],
  },
  EXACT: {
    category: 'Text',
    shortDescription: 'Returns TRUE if both text strings are exactly the same.',
    parameters: [{name: 'Text1', description: ''}, {name: 'Text2', description: ''}],
  },
  FIND: {
    category: 'Text',
    shortDescription: 'Returns the location of one text string inside another.',
    parameters: [{name: 'Text1', description: ''}, {name: 'Text2', description: ''}, {name: 'Number', description: ''}],
  },
  LEFT: {
    category: 'Text',
    shortDescription: 'Extracts a given number of characters from the left side of a text string.',
    parameters: [{name: 'Text', description: ''}, {name: 'Number', description: ''}],
  },
  LEN: {
    category: 'Text',
    shortDescription: 'Returns length of a given text.',
    parameters: [{name: 'Text', description: ''}],
  },
  LOWER: {
    category: 'Text',
    shortDescription: 'Returns text converted to lowercase.',
    parameters: [{name: 'Text', description: ''}],
  },
  MID: {
    category: 'Text',
    shortDescription: 'Returns substring of a given length starting from Start_position.',
    parameters: [{name: 'Text', description: ''}, {name: 'Start_position', description: ''}, {name: 'Length', description: ''}],
  },
  N: {
    category: 'Text',
    shortDescription: 'Converts a value to a number.',
    parameters: [{name: 'Value', description: ''}],
  },
  PROPER: {
    category: 'Text',
    shortDescription: 'Capitalizes words given text string.',
    parameters: [{name: 'Text', description: ''}],
  },
  REPLACE: {
    category: 'Text',
    shortDescription: 'Replaces substring of a text of a given length that starts at given position.',
    parameters: [{name: 'Text', description: ''}, {name: 'Start_position', description: ''}, {name: 'Length', description: ''}, {name: 'New_text', description: ''}],
  },
  REPT: {
    category: 'Text',
    shortDescription: 'Repeats text a given number of times.',
    parameters: [{name: 'Text', description: ''}, {name: 'Number', description: ''}],
  },
  RIGHT: {
    category: 'Text',
    shortDescription: 'Extracts a given number of characters from the right side of a text string.',
    parameters: [{name: 'Text', description: ''}, {name: 'Number', description: ''}],
  },
  SEARCH: {
    category: 'Text',
    shortDescription: 'Returns the location of Search_string inside Text. Case-insensitive. Allows the use of wildcards.',
    parameters: [{name: 'Search_string', description: ''}, {name: 'Text', description: ''}, {name: 'Start_position', description: ''}],
  },
  SPLIT: {
    category: 'Text',
    shortDescription: 'Divides the provided text using the space character as a separator and returns the substring at the zero-based position specified by the second argument.<br>`SPLIT("Lorem ipsum", 0) -> "Lorem"`<br>`SPLIT("Lorem ipsum", 1) -> "ipsum"`',
    parameters: [{name: 'Text', description: ''}, {name: 'Index', description: ''}],
  },
  SUBSTITUTE: {
    category: 'Text',
    shortDescription: 'Returns string where occurrences of Old_text are replaced by New_text. Replaces only specific occurrence if last parameter is provided.',
    parameters: [{name: 'Text', description: ''}, {name: 'Old_text', description: ''}, {name: 'New_text', description: ''}, {name: 'Occurrence', description: ''}],
  },
  T: {
    category: 'Text',
    shortDescription: 'Returns text if given value is text, empty string otherwise.',
    parameters: [{name: 'Value', description: ''}],
  },
  TEXT: {
    category: 'Text',
    shortDescription: 'Converts a number into text according to a given format.<br>By default, accepts the same formats that can be passed to the [`dateFormats`](../api/interfaces/configparams.md#dateformats) option, but can be further customized with the [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime) option.',
    parameters: [{name: 'Number', description: ''}, {name: 'Format', description: ''}],
  },
  TEXTJOIN: {
    category: 'Text',
    shortDescription: 'Joins text from multiple strings and/or ranges with a delimiter. Supports array/range delimiters that cycle through gaps. When ignore_empty is TRUE, empty strings are skipped. Returns #VALUE! if result exceeds 32,767 characters.',
    parameters: [{name: 'Delimiter', description: ''}, {name: 'Ignore_empty', description: ''}, {name: 'Text1', description: ''}],
  },
  TRIM: {
    category: 'Text',
    shortDescription: 'Strips extra spaces from text.',
    parameters: [{name: 'Text', description: ''}],
  },
  UNICHAR: {
    category: 'Text',
    shortDescription: 'Returns the character created by using provided code point.',
    parameters: [{name: 'Number', description: ''}],
  },
  UNICODE: {
    category: 'Text',
    shortDescription: 'Returns the Unicode code point of a first character of a text.',
    parameters: [{name: 'Text', description: ''}],
  },
  UPPER: {
    category: 'Text',
    shortDescription: 'Returns text converted to uppercase.',
    parameters: [{name: 'Text', description: ''}],
  },
  VALUE: {
    category: 'Text',
    shortDescription: 'Parses a number, date, time, datetime, currency, or percentage from a text string.',
    parameters: [{name: 'Text', description: ''}],
  },
}
