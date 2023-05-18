/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {createToken, Lexer, TokenType} from 'chevrotain'
import {ErrorType} from '../Cell'
import {ParserConfig} from './ParserConfig'
import {
  ALL_WHITESPACE_PATTERN,
  COLUMN_REFERENCE_PATTERN,
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

export const ProcedureName = createToken({ name: 'ProcedureName', pattern: new RegExp(`([${UNICODE_LETTER_PATTERN}][${NON_RESERVED_CHARACTER_PATTERN}]*)\\(`) })

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
  const OffsetProcedureName = createToken({ name: 'OffsetProcedureName', pattern: new RegExp(offsetProcedureNameLiteral, 'i') })

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

