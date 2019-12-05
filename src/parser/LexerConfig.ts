import {createToken, Lexer, TokenType} from 'chevrotain'
import {ParserConfig} from './ParserConfig'
import {ErrorType} from "../Cell";
import {TranslationPackage} from "../i18n";

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
export const sheetNameRegexp = "[A-Za-z0-9_\u00C0-\u02AF]+!"
export const RelativeCell = createToken({
  name: 'RelativeCell',
  pattern: /[A-Za-z]+[0-9]+/,
  categories: CellReference
})
export const AbsoluteColCell = createToken({
  name: 'AbsoluteColCell',
  pattern: /\$[A-Za-z]+[0-9]+/,
  categories: CellReference
})
export const AbsoluteRowCell = createToken({
  name: 'AbsoluteRowCell',
  pattern: /[A-Za-z]+\$[0-9]+/,
  categories: CellReference
})
export const AbsoluteCell = createToken({
  name: 'AbsoluteCell',
  pattern: /\$[A-Za-z]+\$[0-9]+/,
  categories: CellReference
})
export const SheetRelativeCell = createToken({
  name: 'SheetRelativeCell',
  pattern: new RegExp(`${sheetNameRegexp}[A-Za-z]+[0-9]+`),
  categories: CellReference
})
export const SheetAbsoluteColCell = createToken({
  name: 'SheetAbsoluteColCell',
  pattern: new RegExp(`${sheetNameRegexp}\\$[A-Za-z]+[0-9]+`),
  categories: CellReference
})
export const SheetAbsoluteRowCell = createToken({
  name: 'SheetAbsoluteRowCell',
  pattern: new RegExp(`${sheetNameRegexp}[A-Za-z]+\\$[0-9]+`),
  categories: CellReference
})
export const SheetAbsoluteCell = createToken({
  name: 'SheetAbsoluteCell',
  pattern: new RegExp(`${sheetNameRegexp}\\$[A-Za-z]+\\$[0-9]+`),
  categories: CellReference
})
export const RangeSeparator = createToken({name: 'RangeSeparator', pattern: /:/})

/* parenthesis */
export const LParen = createToken({name: 'LParen', pattern: /\(/})
export const RParen = createToken({name: 'RParen', pattern: /\)/})

/* prcoedures */
export const ProcedureName = createToken({name: 'ProcedureName', pattern: /(\.?[A-Za-z\u00C0-\u02AF]+)+/})

/* terminals */
export const NumberLiteral = createToken({name: 'NumberLiteral', pattern: /\d+(\.\d+)?/})

/* string literal */
export const StringLiteral = createToken({name: 'StringLiteral', pattern: /"([^"\\]*(\\.[^"\\]*)*)"/})

/* error literal */
export const ErrorLiteral = createToken({name: 'ErrorLiteral', pattern: /#[A-Za-z\/]+[\?\!]?/})

/* skipping whitespaces */
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED,
})

export interface ILexerConfig {
  ArgSeparator: TokenType,
  OffsetProcedureName: TokenType
  allTokens: TokenType[],
  errorMapping: Record<string, ErrorType>,
  functionMapping: Record<string, string>
}

export const buildLexerConfig = (config: ParserConfig): ILexerConfig => {
  /* separator */
  const ArgSeparator = createToken({name: 'ArgSeparator', pattern: config.functionArgSeparator})
  const offsetProcedureNameLiteral = config.language.functions['OFFSET'] || 'OFFSET'
  const OffsetProcedureName = createToken({
    name: 'OffsetProcedureName',
    pattern: new RegExp(offsetProcedureNameLiteral, 'i')
  })
  const errorMapping = buildErrorMapping(config.language)
  const functionMapping = buildFunctionMapping(config.language)

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
    OffsetProcedureName,
    allTokens,
    errorMapping,
    functionMapping
  }
}

const buildErrorMapping = (language: TranslationPackage): Record<string, ErrorType> => {
  return Object.keys(language.errors).reduce((ret, key) => {
    ret[language.errors[key as ErrorType]] = key as ErrorType
    return ret
  }, {} as Record<string, ErrorType>)
}

const buildFunctionMapping = (language: TranslationPackage): Record<string, string> => {
  return Object.keys(language.functions).reduce((ret, key) => {
    ret[language.functions[key]] = key
    return ret
  }, {} as Record<string, string>)
}
