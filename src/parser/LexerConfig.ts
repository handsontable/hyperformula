import {createToken, Lexer, TokenType} from 'chevrotain'
import {ErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'
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
export const CellReference = createToken({name: 'CellReference', pattern: Lexer.NA})
export const additionalCharactersAllowedInQuotes = ' ' // It's included in regexps, so escape characters which have special regexp semantics
export const sheetNameRegexp = `([A-Za-z0-9_\u00C0-\u02AF]+|'[A-Za-z0-9${additionalCharactersAllowedInQuotes}_\u00C0-\u02AF]+')!`
export const RelativeCell = createToken({
  name: 'RelativeCell',
  pattern: /[A-Za-z]+[0-9]+/,
  categories: CellReference,
})
export const AbsoluteColCell = createToken({
  name: 'AbsoluteColCell',
  pattern: /\$[A-Za-z]+[0-9]+/,
  categories: CellReference,
})
export const AbsoluteRowCell = createToken({
  name: 'AbsoluteRowCell',
  pattern: /[A-Za-z]+\$[0-9]+/,
  categories: CellReference,
})
export const AbsoluteCell = createToken({
  name: 'AbsoluteCell',
  pattern: /\$[A-Za-z]+\$[0-9]+/,
  categories: CellReference,
})
export const SheetRelativeCell = createToken({
  name: 'SheetRelativeCell',
  pattern: new RegExp(`${sheetNameRegexp}[A-Za-z]+[0-9]+`),
  categories: CellReference,
})
export const SheetAbsoluteColCell = createToken({
  name: 'SheetAbsoluteColCell',
  pattern: new RegExp(`${sheetNameRegexp}\\$[A-Za-z]+[0-9]+`),
  categories: CellReference,
})
export const SheetAbsoluteRowCell = createToken({
  name: 'SheetAbsoluteRowCell',
  pattern: new RegExp(`${sheetNameRegexp}[A-Za-z]+\\$[0-9]+`),
  categories: CellReference,
})
export const SheetAbsoluteCell = createToken({
  name: 'SheetAbsoluteCell',
  pattern: new RegExp(`${sheetNameRegexp}\\$[A-Za-z]+\\$[0-9]+`),
  categories: CellReference,
})
export const RangeSeparator = createToken({name: 'RangeSeparator', pattern: /:/})

/* parenthesis */
export const LParen = createToken({name: 'LParen', pattern: /\(/})
export const RParen = createToken({name: 'RParen', pattern: /\)/})

/* prcoedures */
export const ProcedureName = createToken({name: 'ProcedureName', pattern: /(\.?[0-9A-Za-z\u00C0-\u02AF]+)+\(/})

/* terminals */
// export const NumberLiteral = createToken({name: 'NumberLiteral', pattern: /[\d]*[.]?[\d]+/  })

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
  parseNumericString: (input: string) => number
}

export const buildLexerConfig = (config: ParserConfig): ILexerConfig => {
  const offsetProcedureNameLiteral = config.language.functions.OFFSET || 'OFFSET'
  const OffsetProcedureName = createToken({
    name: 'OffsetProcedureName',
    pattern: new RegExp(offsetProcedureNameLiteral, 'i'),
  })
  const errorMapping = config.errorMapping
  const functionMapping = buildFunctionMapping(config.language)
  const parseNumericString = config.parseNumericString

  /* configurable tokens */
  const ArgSeparator = createToken({name: 'ArgSeparator', pattern: config.functionArgSeparator})
  const NumberLiteral = createToken({name: 'NumberLiteral', pattern: new RegExp(`[\\d]*[${config.decimalSeparator}]?[\\d]+`)})

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
    SheetAbsoluteCell,
    SheetAbsoluteColCell,
    SheetAbsoluteRowCell,
    SheetRelativeCell,
    AbsoluteCell,
    AbsoluteColCell,
    AbsoluteRowCell,
    RelativeCell,
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
    NumberLiteral,
    OffsetProcedureName,
    allTokens,
    errorMapping,
    functionMapping,
    parseNumericString
  }
}

const buildFunctionMapping = (language: TranslationPackage): Record<string, string> => {
  return Object.keys(language.functions).reduce((ret, key) => {
    ret[language.functions[key]] = key
    return ret
  }, {} as Record<string, string>)
}
