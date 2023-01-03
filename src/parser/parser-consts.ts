/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

export const RANGE_OPERATOR = ':'
export const ABSOLUTE_OPERATOR = '$'
export const ALL_WHITESPACE_REGEXP_PATTERN = '\\s+'
export const ODFF_WHITESPACE_REGEXP_PATTERN = '[ \\t\\n\\r]+'

export const UNQUOTED_SHEET_NAME_REGEXP_PATTERN = '[A-Za-z0-9_\u00C0-\u02AF]+'
export const QUOTED_SHEET_NAME_REGEXP_PATTERN = "'(((?!').|'')*)'"
export const SHEET_NAME_REGEXP_PATTERN = `(${UNQUOTED_SHEET_NAME_REGEXP_PATTERN}|${QUOTED_SHEET_NAME_REGEXP_PATTERN})!`

export const CELL_REFERENCE_REGEXP_PATTERN = `((${SHEET_NAME_REGEXP_PATTERN})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+\\${ABSOLUTE_OPERATOR}?[0-9]+)[^A-Za-z0-9\u00C0-\u02AF._]`
export const NAMED_EXPRESSION_REGEXP_PATTERN = '[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF._]*'
