/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {createToken, Lexer, TokenType} from 'chevrotain'
import {ErrorType} from '../Cell'
import {ParserConfig} from './ParserConfig'
import {
  ALL_WHITESPACE_PATTERN,
  COLUMN_REFERENCE_PATTERN,
  EXCEL_INTERNAL_FUNCTION_PREFIX_PATTERN,
  NON_RESERVED_CHARACTER_PATTERN,
  ODFF_WHITESPACE_PATTERN,
  RANGE_OPERATOR,
  ROW_REFERENCE_PATTERN,
  UNICODE_LETTER_PATTERN,
} from './parser-consts'
import {CellReferenceMatcher} from './CellReferenceMatcher'
import {NamedExpressionMatcher} from './NamedExpressionMatcher'

export const AdditionOp = createToken({ name: 'AdditionOp', pattern: Lexer.NA })
export const PlusOp = createToken({name: 'PlusOp', pattern: /\+/, categories: AdditionOp})
export const MinusOp = createToken({name: 'MinusOp', pattern: /-/, categories: AdditionOp})
export const MultiplicationOp = createToken({ name: 'MultiplicationOp', pattern: Lexer.NA })
export const TimesOp = createToken({name: 'TimesOp', pattern: /\*/, categories: MultiplicationOp})
export const DivOp = createToken({name: 'DivOp', pattern: /\//, categories: MultiplicationOp})
export const PowerOp = createToken({name: 'PowerOp', pattern: /\^/})
export const PercentOp = createToken({name: 'PercentOp', pattern: /%/})
export const BooleanOp = createToken({ name: 'BooleanOp', pattern: Lexer.NA })
export const EqualsOp = createToken({name: 'EqualsOp', pattern: /=/, categories: BooleanOp})
export const NotEqualOp = createToken({name: 'NotEqualOp', pattern: /<>/, categories: BooleanOp})
export const GreaterThanOp = createToken({name: 'GreaterThanOp', pattern: />/, categories: BooleanOp})
export const LessThanOp = createToken({name: 'LessThanOp', pattern: /</, categories: BooleanOp})
export const GreaterThanOrEqualOp = createToken({name: 'GreaterThanOrEqualOp', pattern: />=/, categories: BooleanOp})
export const LessThanOrEqualOp = createToken({name: 'LessThanOrEqualOp', pattern: /<=/, categories: BooleanOp})
export const ConcatenateOp = createToken({name: 'ConcatenateOp', pattern: /&/})

export const LParen = createToken({name: 'LParen', pattern: /\(/})
export const RParen = createToken({name: 'RParen', pattern: /\)/})
export const ArrayLParen = createToken({name: 'ArrayLParen', pattern: /{/})
export const ArrayRParen = createToken({name: 'ArrayRParen', pattern: /}/})

export const StringLiteral = createToken({name: 'StringLiteral', pattern: /"([^"\\]*(\\.[^"\\]*)*)"/})
export const ErrorLiteral = createToken({name: 'ErrorLiteral', pattern: /#[A-Za-z0-9\/]+[?!]?/})

export const RangeSeparator = createToken({ name: 'RangeSeparator', pattern: new RegExp(RANGE_OPERATOR) })
export const ColumnRange = createToken({ name: 'ColumnRange', pattern: new RegExp(`${COLUMN_REFERENCE_PATTERN}${RANGE_OPERATOR}${COLUMN_REFERENCE_PATTERN}`) })
export const RowRange = createToken({ name: 'RowRange', pattern: new RegExp(`${ROW_REFERENCE_PATTERN}${RANGE_OPERATOR}${ROW_REFERENCE_PATTERN}`) })

export const ProcedureName = createToken({ name: 'ProcedureName', pattern: new RegExp(`(?:${EXCEL_INTERNAL_FUNCTION_PREFIX_PATTERN})?([${UNICODE_LETTER_PATTERN}][${NON_RESERVED_CHARACTER_PATTERN}]*)\\(`) })

const excelInternalFunctionPrefixRegexp = new RegExp(`^(?:${EXCEL_INTERNAL_FUNCTION_PREFIX_PATTERN})`)
const UNDERSCORE_CHAR_CODE = '_'.charCodeAt(0)

/**
 * Strips one of Excel's internal function-name prefixes (see EXCEL_INTERNAL_FUNCTION_PREFIX_PATTERN)
 * off the front of a token image, if present.
 *
 * Every prefix starts with `_`, and this function is called on every ProcedureName and
 * OffsetProcedureName token in every parse, so the common case — a name with no prefix at all — takes
 * a plain character check instead of always paying for the regex match-and-fail.
 *
 * @param {string} nameWithoutTrailingParen - a token image with any trailing `(` already removed
 */
function stripExcelInternalFunctionPrefix(nameWithoutTrailingParen: string): string {
  if (nameWithoutTrailingParen.charCodeAt(0) !== UNDERSCORE_CHAR_CODE) {
    return nameWithoutTrailingParen
  }
  return nameWithoutTrailingParen.replace(excelInternalFunctionPrefixRegexp, '')
}

/**
 * Reads the canonical function name out of a ProcedureName token.
 *
 * The token image spans the whole match, so it carries the trailing opening parenthesis and, for a
 * formula imported from an .xlsx file, one of the prefixes Excel prepends when it serializes a
 * workbook. Dropping both here is what lets `_xlfn.IFS(A1)` resolve to the same function as `IFS(A1)`.
 *
 * The prefix is removed before the name is upper-cased, because the prefixes are matched in lower
 * case only.
 *
 * @param {string} image - image of the ProcedureName token, for example `_xlfn.IFS(`
 * @param {Record<string, string>} functionMapping - maps a translated function name to its canonical English name
 */
export function canonicalProcedureNameFromToken(image: string, functionMapping: Record<string, string>): string {
  const procedureName = stripExcelInternalFunctionPrefix(image.slice(0, -1)).toUpperCase()
  return functionMapping[procedureName] ?? procedureName
}

/**
 * Strips an Excel internal function-name prefix off an OffsetProcedureName token's image.
 *
 * OffsetProcedureName has no trailing parenthesis to remove (unlike ProcedureName — OFFSET's grammar
 * rule consumes `(` separately) and no translation lookup (the token pattern already embeds the
 * localized OFFSET name), so it needs only the prefix stripped, not the full canonicalization above.
 *
 * @param {string} image - image of the OffsetProcedureName token, for example `_xlfn.OFFSET`
 */
export function canonicalOffsetProcedureNameFromToken(image: string): string {
  return stripExcelInternalFunctionPrefix(image)
}

const cellReferenceMatcher = new CellReferenceMatcher()
export const CellReference = createToken({
  name: 'CellReference',
  pattern: cellReferenceMatcher.match.bind(cellReferenceMatcher),
  start_chars_hint: cellReferenceMatcher.POSSIBLE_START_CHARACTERS,
  line_breaks: false,
})

const namedExpressionMatcher = new NamedExpressionMatcher()
export const NamedExpression = createToken({
  name: 'NamedExpression',
  pattern: namedExpressionMatcher.match.bind(namedExpressionMatcher),
  start_chars_hint: namedExpressionMatcher.POSSIBLE_START_CHARACTERS,
  line_breaks: false,
})

export interface LexerConfig {
  ArgSeparator: TokenType,
  NumberLiteral: TokenType,
  OffsetProcedureName: TokenType,
  allTokens: TokenType[],
  errorMapping: Record<string, ErrorType>,
  functionMapping: Record<string, string>,
  decimalSeparator: '.' | ',',
  ArrayColSeparator: TokenType,
  ArrayRowSeparator: TokenType,
  WhiteSpace: TokenType,
  maxColumns: number,
  maxRows: number,
}

/**
 * Builds the configuration object for the lexer
 */
export const buildLexerConfig = (config: ParserConfig): LexerConfig => {
  const offsetProcedureNameLiteral = config.translationPackage.getFunctionTranslation('OFFSET')
  const errorMapping = config.errorMapping
  const functionMapping = config.translationPackage.buildFunctionMapping()
  const whitespaceTokenRegexp = new RegExp(config.ignoreWhiteSpace === 'standard' ? ODFF_WHITESPACE_PATTERN : ALL_WHITESPACE_PATTERN)

  const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: whitespaceTokenRegexp })
  const ArrayRowSeparator = createToken({name: 'ArrayRowSep', pattern: config.arrayRowSeparator})
  const ArrayColSeparator = createToken({name: 'ArrayColSep', pattern: config.arrayColumnSeparator})
  const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: new RegExp(`(([${config.decimalSeparator}]\\d+)|(\\d+([${config.decimalSeparator}]\\d*)?))(e[+-]?\\d+)?`) })
  // OFFSET has its own token because it has its own grammar rule, so it needs the prefix handling of
  // ProcedureName repeated here. The 'i' flag exists for the translated OFFSET name (pre-dates this
  // prefix support) and applies to the whole pattern, so unlike ProcedureName it also makes the prefix
  // case-insensitive: `_XLFN.OFFSET(...)` is accepted here where `_XLFN.SUM(...)` is a parsing error.
  // Left as-is rather than given a dedicated case-sensitive-prefix matcher: OFFSET predates the OOXML
  // cutoff this whole prefix scheme exists for, so Excel can never actually emit a prefixed OFFSET call
  // in any case — the asymmetry has no reachable real input, only hand-typed formulas (see the
  // "an upper-cased prefix is accepted on OFFSET, unlike everywhere else" test).
  const OffsetProcedureName = createToken({ name: 'OffsetProcedureName', pattern: new RegExp(`(?:${EXCEL_INTERNAL_FUNCTION_PREFIX_PATTERN})?${offsetProcedureNameLiteral}`, 'i') })

  let ArgSeparator: TokenType
  let inject: TokenType[]
  if (config.functionArgSeparator === config.arrayColumnSeparator) {
    ArgSeparator = ArrayColSeparator
    inject = []
  } else if (config.functionArgSeparator === config.arrayRowSeparator) {
    ArgSeparator = ArrayRowSeparator
    inject = []
  } else {
    ArgSeparator = createToken({name: 'ArgSeparator', pattern: config.functionArgSeparator})
    inject = [ArgSeparator]
  }

  /* order is important, first pattern is used */
  const allTokens = [
    WhiteSpace,
    PlusOp,
    MinusOp,
    TimesOp,
    DivOp,
    PowerOp,
    EqualsOp,
    NotEqualOp,
    PercentOp,
    GreaterThanOrEqualOp,
    LessThanOrEqualOp,
    GreaterThanOp,
    LessThanOp,
    LParen,
    RParen,
    ArrayLParen,
    ArrayRParen,
    OffsetProcedureName,
    ProcedureName,
    RangeSeparator,
    ...inject,
    ColumnRange,
    RowRange,
    NumberLiteral,
    StringLiteral,
    ErrorLiteral,
    ConcatenateOp,
    BooleanOp,
    AdditionOp,
    MultiplicationOp,
    CellReference,
    NamedExpression,
    ArrayRowSeparator,
    ArrayColSeparator,
  ]

  return {
    ArgSeparator,
    NumberLiteral,
    OffsetProcedureName,
    ArrayRowSeparator,
    ArrayColSeparator,
    WhiteSpace,
    allTokens,
    errorMapping,
    functionMapping,
    decimalSeparator: config.decimalSeparator,
    maxColumns: config.maxColumns,
    maxRows: config.maxRows
  }
}

