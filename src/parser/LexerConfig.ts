/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {createToken, Lexer, TokenType} from 'chevrotain'
import {ErrorType} from '../Cell'
import {ParserConfig} from './ParserConfig'

export const RANGE_OPERATOR = ':'
export const ABSOLUTE_OPERATOR = '$'

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
export const simpleSheetName = '[A-Za-z0-9_\u00C0-\u02AF]+'
export const quotedSheetName = "'(((?!').|'')*)'"
export const sheetNameRegexp = `(${simpleSheetName}|${quotedSheetName})!`

export const CellReference = createToken({
  name: 'CellReference',
  pattern: new RegExp(`(${sheetNameRegexp})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+\\${ABSOLUTE_OPERATOR}?[0-9]+`),
})

export const ColumnRange = createToken({
  name: 'ColumnRange',
  pattern: new RegExp(`(${sheetNameRegexp})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+${RANGE_OPERATOR}(${sheetNameRegexp})?\\${ABSOLUTE_OPERATOR}?[A-Za-z]+`),
})

export const RowRange = createToken({
  name: 'RowRange',
  pattern: new RegExp(`(${sheetNameRegexp})?\\${ABSOLUTE_OPERATOR}?[0-9]+${RANGE_OPERATOR}(${sheetNameRegexp})?\\${ABSOLUTE_OPERATOR}?[0-9]+`),
})

export const RangeSeparator = createToken({name: 'RangeSeparator', pattern: `${RANGE_OPERATOR}`})

/* parenthesis */
export const LParen = createToken({name: 'LParen', pattern: /\(/})
export const RParen = createToken({name: 'RParen', pattern: /\)/})

/* array parenthesis */
export const ArrayLParen = createToken({name: 'ArrayLParen', pattern: /{/})
export const ArrayRParen = createToken({name: 'ArrayRParen', pattern: /}/})

/* procedures */
export const ProcedureName = createToken({
  name: 'ProcedureName',
  pattern: /([A-Za-z\u00C0-\u02AF][A-Za-z0-9\u00C0-\u02AF._]*)\(/
})

/* named expressions */
export const NamedExpression = createToken({
  name: 'NamedExpression',
  pattern: /[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF._]*/
})

/* string literal */
export const StringLiteral = createToken({name: 'StringLiteral', pattern: /"([^"\\]*(\\.[^"\\]*)*)"/})

/* error literal */
export const ErrorLiteral = createToken({name: 'ErrorLiteral', pattern: /#[A-Za-z0-9\/]+[?!]?/})

/* skipping whitespaces */
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
})

export interface ILexerConfig {
  ArgSeparator: TokenType,
  NumberLiteral: TokenType,
  OffsetProcedureName: TokenType,
  allTokens: TokenType[],
  errorMapping: Record<string, ErrorType>,
  functionMapping: Record<string, string>,
  decimalSeparator: '.' | ',',
  ArrayColSeparator: TokenType,
  ArrayRowSeparator: TokenType,
  maxColumns: number,
  maxRows: number,
}

export const buildLexerConfig = (config: ParserConfig): ILexerConfig => {
  const offsetProcedureNameLiteral = config.translationPackage.getFunctionTranslation('OFFSET')
  const errorMapping = config.errorMapping
  const functionMapping = config.translationPackage.buildFunctionMapping()

  const ArrayRowSeparator = createToken({name: 'ArrayRowSep', pattern: config.arrayRowSeparator})
  const ArrayColSeparator = createToken({name: 'ArrayColSep', pattern: config.arrayColumnSeparator})

  /* configurable tokens */
  let ArgSeparator, inject: TokenType[]
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
  const NumberLiteral = createToken({
    name: 'NumberLiteral',
    pattern: new RegExp(`(([${config.decimalSeparator}]\\d+)|(\\d+([${config.decimalSeparator}]\\d*)?))(e[+-]?\\d+)?`)
  })
  const OffsetProcedureName = createToken({
    name: 'OffsetProcedureName',
    pattern: new RegExp(offsetProcedureNameLiteral, 'i')
  })

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
    allTokens,
    errorMapping,
    functionMapping,
    decimalSeparator: config.decimalSeparator,
    maxColumns: config.maxColumns,
    maxRows: config.maxRows
  }
}

