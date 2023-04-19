/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

export const RANGE_OPERATOR = ':'
export const ABSOLUTE_OPERATOR = '$'

export const ALL_WHITESPACE_PATTERN = '\\s+'
export const ODFF_WHITESPACE_PATTERN = '[ \\t\\n\\r]+'

export const UNICODE_LETTER_PATTERN = 'A-Za-z\u00C0-\u02AF'
export const NON_RESERVED_CHARACTER_PATTERN = `${UNICODE_LETTER_PATTERN}0-9_.`

export const UNQUOTED_SHEET_NAME_PATTERN = `[${UNICODE_LETTER_PATTERN}0-9_]+`
export const QUOTED_SHEET_NAME_PATTERN = "'(((?!').|'')*)'"
export const SHEET_NAME_PATTERN = `(${UNQUOTED_SHEET_NAME_PATTERN}|${QUOTED_SHEET_NAME_PATTERN})!`

export const CELL_REFERENCE_PATTERN = `(${SHEET_NAME_PATTERN})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+\\${ABSOLUTE_OPERATOR}?[0-9]+`
export const COLUMN_REFERENCE_PATTERN = `(${SHEET_NAME_PATTERN})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+`
export const ROW_REFERENCE_PATTERN = `(${SHEET_NAME_PATTERN})?\\${ABSOLUTE_OPERATOR}?[0-9]+`
export const R1C1_CELL_REFERENCE_PATTERN = '[rR][0-9]*[cC][0-9]*'
export const CELL_REFERENCE_WITH_NEXT_CHARACTER_PATTERN = `(${CELL_REFERENCE_PATTERN})[^${NON_RESERVED_CHARACTER_PATTERN}]`

export const NAMED_EXPRESSION_PATTERN = `[${UNICODE_LETTER_PATTERN}_][${NON_RESERVED_CHARACTER_PATTERN}]*`

export const ALL_DIGITS_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const ALL_UNICODE_LETTERS_ARRAY = [
  ...Array.from(Array(26)).map((_, i) => i + 'A'.charCodeAt(0)),
  ...Array.from(Array(26)).map((_, i) => i + 'a'.charCodeAt(0)),
  ...Array.from(Array(0x02AF-0x00C0+1)).map((_, i) => i + 0x00C0),
].map(code => String.fromCharCode(code))
