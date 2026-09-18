/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
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

/**
 * Prefixes that Excel prepends to a function name when it serializes a workbook.
 *
 * Excel marks every function added after the original OOXML specification (~Excel 2007) with one
 * of these prefixes in the stored XML, so a file may contain `_xlfn.IFS(...)` where the user typed
 * `IFS(...)`. They are serialization artifacts rather than a part of the function name, and other
 * spreadsheet engines drop them on import, so HyperFormula accepts and ignores them too.
 *
 * | Prefix         | Meaning                                                  |
 * |----------------|----------------------------------------------------------|
 * | `_xlfn.`       | function newer than the OOXML specification               |
 * | `_xlfn._xlws.` | as above, and callable only in a worksheet                |
 * | `_xlws.`       | callable only in a worksheet                             |
 * | `_xlpm.`       | `LAMBDA`/`LET` parameter name                            |
 * | `_xludf.`      | user-defined function (a `LAMBDA` stored in Name Manager) |
 *
 * The alternatives are ordered longest-first so that `_xlfn._xlws.` is consumed whole instead of
 * leaving `_xlws.` behind. Excel always writes them in lower case, so wherever this pattern is used
 * to recognize a *function call* (the `ProcedureName` token in LexerConfig.ts) it is matched in lower
 * case only: an upper-cased spelling there is not something Excel can produce. The one exception is
 * the `OffsetProcedureName` token, which reuses this pattern inside an already case-insensitive regex
 * (for the translated OFFSET name) and so matches an upper-cased prefix too — see its comment.
 */
export const EXCEL_INTERNAL_FUNCTION_PREFIX_PATTERN = '_xlfn\\._xlws\\.|_xlfn\\.|_xlws\\.|_xlpm\\.|_xludf\\.'

export const NAMED_EXPRESSION_PATTERN = `[${UNICODE_LETTER_PATTERN}_][${NON_RESERVED_CHARACTER_PATTERN}]*`

export const ALL_DIGITS_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const ALL_UNICODE_LETTERS_ARRAY = [
  ...Array.from(Array(26)).map((_, i) => i + 'A'.charCodeAt(0)),
  ...Array.from(Array(26)).map((_, i) => i + 'a'.charCodeAt(0)),
  ...Array.from(Array(0x02AF-0x00C0+1)).map((_, i) => i + 0x00C0),
].map(code => String.fromCharCode(code))
