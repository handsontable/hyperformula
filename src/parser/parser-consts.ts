/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

export const RANGE_OPERATOR = ':'
export const ABSOLUTE_OPERATOR = '$'
export const ALL_WHITESPACE_PATTERN = '\\s+'
export const ODFF_WHITESPACE_PATTERN = '[ \\t\\n\\r]+'

export const UNQUOTED_SHEET_NAME_PATTERN = '[A-Za-z0-9_\u00C0-\u02AF]+'
export const QUOTED_SHEET_NAME_PATTERN = "'(((?!').|'')*)'"
export const SHEET_NAME_PATTERN = `(${UNQUOTED_SHEET_NAME_PATTERN}|${QUOTED_SHEET_NAME_PATTERN})!`

export const R1C1_CELL_REFERENCE_PATTERN = '[rR][0-9]*[cC][0-9]*'
export const CELL_REFERENCE_PATTERN = `(${SHEET_NAME_PATTERN})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+\\${ABSOLUTE_OPERATOR}?[0-9]+`
export const CELL_REFERENCE_WITH_NEXT_CHARACTER_PATTERN = `(${CELL_REFERENCE_PATTERN})[^A-Za-z0-9\u00C0-\u02AF._]`
export const NAMED_EXPRESSION_PATTERN = '[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF._]*'
