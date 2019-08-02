import {createToken, Lexer, TokenType} from 'chevrotain'
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
export const SheetRelativeCell = createToken({name: 'SheetRelativeCell', pattern: /\$[A-Za-z0-9]+\.[A-Za-z]+[0-9]+/, categories: CellReference})
export const SheetAbsoluteColCell = createToken({name: 'SheetAbsoluteColCell', pattern: /\$[A-Za-z0-9]+\.\$[A-Za-z]+[0-9]+/, categories: CellReference})
export const SheetAbsoluteRowCell = createToken({name: 'SheetAbsoluteRowCell', pattern: /\$[A-Za-z0-9]+\.[A-Za-z]+\$[0-9]+/, categories: CellReference})
export const SheetAbsoluteCell = createToken({name: 'SheetAbsoluteCell', pattern: /\$[A-Za-z0-9]+\.\$[A-Za-z]+\$[0-9]+/, categories: CellReference})
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

/* error literal */
export const ErrorLiteral = createToken({name: 'ErrorLiteral', pattern: /#[A-Za-z]+!/})

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
export const buildLexerConfig = (config: ParserConfig): ILexerConfig => {
  /* separator */
  const ArgSeparator = createToken({name: 'ArgSeparator', pattern: config.functionArgSeparator})

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
    GreaterThanOrEqualOp,
    LessThanOrEqualOp,
    GreaterThanOp,
    LessThanOp,
    LParen,
    RParen,
    RangeSeparator,
    SheetAbsoluteCell,
    SheetAbsoluteColCell,
    SheetAbsoluteRowCell,
    SheetRelativeCell,
    AbsoluteCell,
    AbsoluteColCell,
    AbsoluteRowCell,
    RelativeCell,
    OffsetProcedureName,
    ProcedureName,
    ArgSeparator,
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
    allTokens,
  }
}
