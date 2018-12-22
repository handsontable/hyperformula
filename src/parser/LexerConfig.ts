import {createToken, Lexer, TokenType} from 'chevrotain'
import {Config} from '../Config'

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
export const CellReference = createToken({name: 'CellReference', pattern: Lexer.NA})
export const RelativeCell = createToken({name: 'RelativeCell', pattern: /[A-Za-z]+[0-9]+/, categories: CellReference})
export const AbsoluteColCell = createToken({name: 'AbsoluteColCell', pattern: /\$[A-Za-z]+[0-9]+/, categories: CellReference})
export const AbsoluteRowCell = createToken({name: 'AbsoluteRowCell', pattern: /[A-Za-z]+\$[0-9]+/, categories: CellReference})
export const AbsoluteCell = createToken({name: 'AbsoluteCell', pattern: /\$[A-Za-z]+\$[0-9]+/, categories: CellReference})
export const RangeSeparator = createToken({name: 'RangeSeparator', pattern: /:/})

/* parenthesis */
export const LParen = createToken({name: 'LParen', pattern: /\(/})
export const RParen = createToken({name: 'RParen', pattern: /\)/})

/* prcoedures */
export const OffsetProcedureName = createToken({name: 'OffsetProcedureName', pattern: /OFFSET/i })
export const ProcedureName = createToken({name: 'ProcedureName', pattern: /[A-Za-z]+/})

/* terminals */
export const NumberLiteral = createToken({name: 'NumberLiteral', pattern: /\d+(\.\d+)?/})

/* string literal */
export const StringLiteral = createToken({name: 'StringLiteral', pattern: /"([^"\\]*(\\.[^"\\]*)*)"/})

/* skipping whitespaces */
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED,
})

export interface ILexerConfig {
  ArgSeparator: TokenType,
  allTokens: TokenType[],
}
export const buildLexerConfig = (config: Config): ILexerConfig => {
  /* separator */
  const ArgSeparator = createToken({name: 'ArgSeparator', pattern: Config.FUNCTION_ARG_SEPARATOR})

  /* order is important, first pattern is used */
  const allTokens = [
    WhiteSpace,
    PlusOp,
    MinusOp,
    TimesOp,
    DivOp,
    EqualsOp,
    NotEqualOp,
    GreaterThanOrEqualOp,
    LessThanOrEqualOp,
    GreaterThanOp,
    LessThanOp,
    LParen,
    RParen,
    RangeSeparator,
    AbsoluteCell,
    AbsoluteColCell,
    AbsoluteRowCell,
    RelativeCell,
    OffsetProcedureName,
    ProcedureName,
    ArgSeparator,
    NumberLiteral,
    StringLiteral,
    ConcatenateOp,
    BooleanOp,
    AdditionOp,
    MultiplicationOp,
    CellReference,
  ]
  return {
    ArgSeparator,
    allTokens,
  }
}

