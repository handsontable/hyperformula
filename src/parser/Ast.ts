import {CellError} from '../Cell'
import {CellAddress} from './CellAddress'

export type Ast =
  NumberAst
  | StringAst
  | CellReferenceAst
  | CellRangeAst
  | ConcatenateOpAst
  | MinusUnaryOpAst
  | PlusUnaryOpAst
  | PercentOpAst
  | EqualsOpAst
  | NotEqualOpAst
  | GreaterThanOpAst
  | LessThanOpAst
  | LessThanOrEqualOpAst
  | GreaterThanOrEqualOpAst
  | PlusOpAst
  | MinusOpAst
  | TimesOpAst
  | DivOpAst
  | PowerOpAst
  | ProcedureAst
  | ParenthesisAst
  | ErrorAst

export interface ParsingError {
  type: ParsingErrorType,
  message: string,
}

export enum ParsingErrorType {
  LexingError = 'LexingError',
  ParserError = 'ParsingError',
  StaticOffsetError = 'StaticOffsetError',
  StaticOffsetOutOfRangeError = 'StaticOffsetOutOfRangeError',
  RangeOffsetNotAllowed = 'RangeOffsetNotAllowed',
}

export enum AstNodeType {
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  MINUS_UNARY_OP = 'MINUS_UNARY_OP',
  PLUS_UNARY_OP = 'PLUS_UNARY_OP',

  PERCENT_OP = 'PERCENT_OP',

  CONCATENATE_OP = 'CONCATENATE_OP',

  EQUALS_OP = 'EQUALS_OP',
  NOT_EQUAL_OP = 'NOT_EQUAL_OP',
  GREATER_THAN_OP = 'GREATER_THAN_OP',
  LESS_THAN_OP = 'LESS_THAN_OP',
  GREATER_THAN_OR_EQUAL_OP = 'GREATER_THAN_OR_EQUAL_OP',
  LESS_THAN_OR_EQUAL_OP = 'LESS_THAN_OR_EQUAL_OP',

  PLUS_OP = 'PLUS_OP',
  MINUS_OP = 'MINUS_OP',
  TIMES_OP = 'TIMES_OP',
  DIV_OP = 'DIV_OP',
  POWER_OP = 'POWER_OP',

  FUNCTION_CALL = 'FUNCTION_CALL',

  PARENTHESIS = 'PARENTHESES',

  CELL_REFERENCE = 'CELL_REFERENCE',

  CELL_RANGE = 'CELL_RANGE',

  ERROR = 'ERROR',
}

export interface NumberAst {
  type: AstNodeType.NUMBER,
  value: number,
}

export const buildNumberAst = (value: number): NumberAst => ({type: AstNodeType.NUMBER, value})

export interface StringAst {
  type: AstNodeType.STRING,
  value: string,
}

export const buildStringAst = (value: string): StringAst => ({type: AstNodeType.STRING, value})

export interface CellReferenceAst {
  type: AstNodeType.CELL_REFERENCE,
  reference: CellAddress,
}

export const buildCellReferenceAst = (reference: CellAddress): CellReferenceAst => ({
  type: AstNodeType.CELL_REFERENCE,
  reference,
})

export interface CellRangeAst {
  type: AstNodeType.CELL_RANGE,
  start: CellAddress,
  end: CellAddress,
}

export const buildCellRangeAst = (start: CellAddress, end: CellAddress): CellRangeAst => ({
  type: AstNodeType.CELL_RANGE,
  start,
  end,
})

export interface BinaryOpAst {
  left: Ast,
  right: Ast,
}

export interface ConcatenateOpAst extends BinaryOpAst {
  type: AstNodeType.CONCATENATE_OP,
}

export const buildConcatenateOpAst = (left: Ast, right: Ast): ConcatenateOpAst => ({
  type: AstNodeType.CONCATENATE_OP,
  left,
  right,
})

export interface EqualsOpAst extends BinaryOpAst {
  type: AstNodeType.EQUALS_OP,
}

export const buildEqualsOpAst = (left: Ast, right: Ast): EqualsOpAst => ({
  type: AstNodeType.EQUALS_OP,
  left,
  right,
})

export interface NotEqualOpAst extends BinaryOpAst {
  type: AstNodeType.NOT_EQUAL_OP,
}

export const buildNotEqualOpAst = (left: Ast, right: Ast): NotEqualOpAst => ({
  type: AstNodeType.NOT_EQUAL_OP,
  left,
  right,
})

export interface GreaterThanOpAst extends BinaryOpAst {
  type: AstNodeType.GREATER_THAN_OP,
}

export const buildGreaterThanOpAst = (left: Ast, right: Ast): GreaterThanOpAst => ({
  type: AstNodeType.GREATER_THAN_OP,
  left,
  right,
})

export interface LessThanOpAst extends BinaryOpAst {
  type: AstNodeType.LESS_THAN_OP,
}

export const buildLessThanOpAst = (left: Ast, right: Ast): LessThanOpAst => ({
  type: AstNodeType.LESS_THAN_OP,
  left,
  right,
})

export interface GreaterThanOrEqualOpAst extends BinaryOpAst {
  type: AstNodeType.GREATER_THAN_OR_EQUAL_OP,
}

export const buildGreaterThanOrEqualOpAst = (left: Ast, right: Ast): GreaterThanOrEqualOpAst => ({
  type: AstNodeType.GREATER_THAN_OR_EQUAL_OP,
  left,
  right,
})

export interface LessThanOrEqualOpAst extends BinaryOpAst {
  type: AstNodeType.LESS_THAN_OR_EQUAL_OP,
}

export const buildLessThanOrEqualOpAst = (left: Ast, right: Ast): LessThanOrEqualOpAst => ({
  type: AstNodeType.LESS_THAN_OR_EQUAL_OP,
  left,
  right,
})

export interface PlusOpAst extends BinaryOpAst {
  type: AstNodeType.PLUS_OP,
}

export const buildPlusOpAst = (left: Ast, right: Ast): PlusOpAst => ({
  type: AstNodeType.PLUS_OP,
  left,
  right,
})

export interface MinusOpAst extends BinaryOpAst {
  type: AstNodeType.MINUS_OP,
}

export const buildMinusOpAst = (left: Ast, right: Ast): MinusOpAst => ({
  type: AstNodeType.MINUS_OP,
  left,
  right,
})

export interface MinusUnaryOpAst {
  type: AstNodeType.MINUS_UNARY_OP,
  value: Ast,
}

export const buildMinusUnaryOpAst = (value: Ast): MinusUnaryOpAst => ({
  type: AstNodeType.MINUS_UNARY_OP,
  value,
})

export interface PlusUnaryOpAst {
  type: AstNodeType.PLUS_UNARY_OP,
  value: Ast,
}

export const buildPlusUnaryOpAst = (value: Ast): PlusUnaryOpAst => ({
  type: AstNodeType.PLUS_UNARY_OP,
  value,
})

export interface TimesOpAst extends BinaryOpAst {
  type: AstNodeType.TIMES_OP,
}

export const buildTimesOpAst = (left: Ast, right: Ast): TimesOpAst => ({
  type: AstNodeType.TIMES_OP,
  left,
  right,
})

export interface DivOpAst extends BinaryOpAst {
  type: AstNodeType.DIV_OP,
}

export const buildDivOpAst = (left: Ast, right: Ast): DivOpAst => ({
  type: AstNodeType.DIV_OP,
  left,
  right,
})

export interface PowerOpAst extends BinaryOpAst {
  type: AstNodeType.POWER_OP,
}

export const buildPowerOpAst = (left: Ast, right: Ast): PowerOpAst => ({
  type: AstNodeType.POWER_OP,
  left,
  right,
})

export interface PercentOpAst {
  type: AstNodeType.PERCENT_OP,
  value: Ast,
}

export const buildPercentOpAst = (value: Ast): PercentOpAst => ({
  type: AstNodeType.PERCENT_OP,
  value,
})

export interface ProcedureAst {
  type: AstNodeType.FUNCTION_CALL,
  procedureName: string,
  args: Ast[],
}

export const buildProcedureAst = (procedureName: string, args: Ast[]): ProcedureAst => ({
  type: AstNodeType.FUNCTION_CALL,
  procedureName,
  args,
})

export interface ParenthesisAst {
  type: AstNodeType.PARENTHESIS,
  expression: Ast,
}

export const buildParenthesisAst = (expression: Ast): ParenthesisAst => ({
  type: AstNodeType.PARENTHESIS,
  expression,
})

export interface ErrorAst {
  type: AstNodeType.ERROR,
  args: ParsingError[],
  error?: CellError,
}

export const buildErrorAst = (args: ParsingError[]): ErrorAst => ({type: AstNodeType.ERROR, args})

export const buildCellErrorAst = (error: CellError): ErrorAst => ({type: AstNodeType.ERROR, args: [], error})
