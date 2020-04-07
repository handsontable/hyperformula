import {createToken, Lexer, TokenType} from 'chevrotain'
import {ErrorType} from '../Cell'
import {ParserConfig} from './ParserConfig'

/* arithmetic */
// abstract for + -
export const AdditionOp = createToken({
  name: 'AdditionOp',
  pattern: Lexer.NA,
})
export const PlusOp = createToken({name: 'PlusOp', pattern: /\+/, categories: AdditionOp})
export const MinusOp = createToken({name: 'MinusOp', pattern: /-/, categories: AdditionOp})

// abstract for * /
export const MultiplicationOp = createToken({
  name: 'MultiplicationOp',
  pattern: Lexer.NA,
})
export const TimesOp = createToken({name: 'TimesOp', pattern: /\*/, categories: MultiplicationOp})
export const DivOp = createToken({name: 'DivOp', pattern: /\//, categories: MultiplicationOp})

export const PowerOp = createToken({name: 'PowerOp', pattern: /\^/})

export const PercentOp = createToken({name: 'PercentOp', pattern: /%/})

export const BooleanOp = createToken({
  name: 'BooleanOp',
  pattern: Lexer.NA,
})
export const EqualsOp = createToken({name: 'EqualsOp', pattern: /=/, categories: BooleanOp})
export const NotEqualOp = createToken({name: 'NotEqualOp', pattern: /<>/, categories: BooleanOp})
export const GreaterThanOp = createToken({name: 'GreaterThanOp', pattern: />/, categories: BooleanOp})
export const LessThanOp = createToken({name: 'LessThanOp', pattern: /</, categories: BooleanOp})
export const GreaterThanOrEqualOp = createToken({name: 'GreaterThanOrEqualOp', pattern: />=/, categories: BooleanOp})
export const LessThanOrEqualOp = createToken({name: 'LessThanOrEqualOp', pattern: /<=/, categories: BooleanOp})

export const ConcatenateOp = createToken({name: 'ConcatenateOp', pattern: /&/})

/* addresses */
export const additionalCharactersAllowedInQuotes = ' ' // It's included in regexps, so escape characters which have special regexp semantics
export const sheetNameRegexp = `([A-Za-z0-9_\u00C0-\u02AF]+|'[A-Za-z0-9${additionalCharactersAllowedInQuotes}_\u00C0-\u02AF]+')!`

export const CellReference = createToken({
  name: 'CellReference',
  pattern: new RegExp(`\(${sheetNameRegexp}\)?\\$?[A-Za-z]+\\$?[0-9]+`),
})

export const ColumnRange = createToken({
  name: 'ColumnRange',
  pattern: new RegExp(`\(${sheetNameRegexp}\)?\\$?[A-Za-z]+:\(${sheetNameRegexp}\)?\\$?[A-Za-z]+`),
})

export const RowRange = createToken({
  name: 'RowRange',
  pattern: new RegExp(`\(${sheetNameRegexp}\)?\\$?[0-9]+:\(${sheetNameRegexp}\)?\\$?[0-9]+`),
})


export const RangeSeparator = createToken({name: 'RangeSeparator', pattern: /:/})

/* parenthesis */
export const LParen = createToken({name: 'LParen', pattern: /\(/})
export const RParen = createToken({name: 'RParen', pattern: /\)/})

/* prcoedures */
export const ProcedureName = createToken({name: 'ProcedureName', pattern: /(\.?[0-9A-Za-z\u00C0-\u02AF]+)+\(/})

/* string literal */
export const StringLiteral = createToken({name: 'StringLiteral', pattern: /"([^"\\]*(\\.[^"\\]*)*)"/})

/* error literal */
export const ErrorLiteral = createToken({name: 'ErrorLiteral', pattern: /#[A-Za-z0-9\/]+[?!]?/})

/* skipping whitespaces */
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\n\r]+/,
})

export interface ILexerConfig {
  ArgSeparator: TokenType,
  NumberLiteral: TokenType,
  OffsetProcedureName: TokenType,
  allTokens: TokenType[],
  errorMapping: Record<string, ErrorType>,
  functionMapping: Record<string, string>,
  decimalSeparator: '.' | ',',
}

export const buildLexerConfig = (config: ParserConfig): ILexerConfig => {
  const offsetProcedureNameLiteral = config.translationPackage.getFunctionTranslation('OFFSET')
  const errorMapping = config.errorMapping
  const functionMapping = config.translationPackage.buildFunctionMapping()

  /* configurable tokens */
  const ArgSeparator = createToken({name: 'ArgSeparator', pattern: config.functionArgSeparator})
  const NumberLiteral = createToken({name: 'NumberLiteral', pattern: new RegExp(`[\\d]*[${config.decimalSeparator}]?[\\d]+`)})
  const OffsetProcedureName = createToken({name: 'OffsetProcedureName', pattern: new RegExp(offsetProcedureNameLiteral, 'i')})

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
    OffsetProcedureName,
    ProcedureName,
    RangeSeparator,
    ArgSeparator,
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
  ]

  return {
    ArgSeparator,
    NumberLiteral,
    OffsetProcedureName,
    allTokens,
    errorMapping,
    functionMapping,
    decimalSeparator: config.decimalSeparator
  }
}

