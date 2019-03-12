import {CellAddress} from '../Cell'

export type Ast =
  NumberAst
  | StringAst
  | CellReferenceAst
  | CellRangeAst
  | ConcatenateOpAst
  | MinusUnaryOpAst
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
  | ErrorAst

export interface ParsingError {
  type: ParsingErrorType,
  message: string
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

  CELL_REFERENCE = 'CELL_REFERENCE',

  CELL_RANGE = 'CELL_RANGE',

  ERROR = 'ERROR',
}

export interface NumberAst {
  kind: AstNodeType.NUMBER,
  value: number,
}

export const buildNumberAst = (value: number): NumberAst => ({kind: AstNodeType.NUMBER, value})

export interface StringAst {
  kind: AstNodeType.STRING,
  value: string,
}

export const buildStringAst = (value: string): StringAst => ({kind: AstNodeType.STRING, value})

export interface CellReferenceAst {
  kind: AstNodeType.CELL_REFERENCE,
  reference: CellAddress
}

export const buildCellReferenceAst = (reference: CellAddress): CellReferenceAst => ({
  kind: AstNodeType.CELL_REFERENCE,
  reference,
})

export interface CellRangeAst {
  kind: AstNodeType.CELL_RANGE,
  start: CellAddress,
  end: CellAddress
}

export const buildCellRangeAst = (start: CellAddress, end: CellAddress): CellRangeAst => ({
  kind: AstNodeType.CELL_RANGE,
  start,
  end,
})

export interface BinaryOpAst {
  left: Ast,
  right: Ast,
}

export interface ConcatenateOpAst extends BinaryOpAst {
  kind: AstNodeType.CONCATENATE_OP
}

export const buildConcatenateOpAst = (left: Ast, right: Ast): ConcatenateOpAst => ({
  kind: AstNodeType.CONCATENATE_OP,
  left,
  right,
})

export interface EqualsOpAst extends BinaryOpAst {
  kind: AstNodeType.EQUALS_OP
}

export const buildEqualsOpAst = (left: Ast, right: Ast): EqualsOpAst => ({
  kind: AstNodeType.EQUALS_OP,
  left,
  right,
})

export interface NotEqualOpAst extends BinaryOpAst {
  kind: AstNodeType.NOT_EQUAL_OP
}

export const buildNotEqualOpAst = (left: Ast, right: Ast): NotEqualOpAst => ({
  kind: AstNodeType.NOT_EQUAL_OP,
  left,
  right,
})

export interface GreaterThanOpAst extends BinaryOpAst {
  kind: AstNodeType.GREATER_THAN_OP
}

export const buildGreaterThanOpAst = (left: Ast, right: Ast): GreaterThanOpAst => ({
  kind: AstNodeType.GREATER_THAN_OP,
  left,
  right,
})

export interface LessThanOpAst extends BinaryOpAst {
  kind: AstNodeType.LESS_THAN_OP
}

export const buildLessThanOpAst = (left: Ast, right: Ast): LessThanOpAst => ({
  kind: AstNodeType.LESS_THAN_OP,
  left,
  right,
})

export interface GreaterThanOrEqualOpAst extends BinaryOpAst {
  kind: AstNodeType.GREATER_THAN_OR_EQUAL_OP
}

export const buildGreaterThanOrEqualOpAst = (left: Ast, right: Ast): GreaterThanOrEqualOpAst => ({
  kind: AstNodeType.GREATER_THAN_OR_EQUAL_OP,
  left,
  right,
})

export interface LessThanOrEqualOpAst extends BinaryOpAst {
  kind: AstNodeType.LESS_THAN_OR_EQUAL_OP
}

export const buildLessThanOrEqualOpAst = (left: Ast, right: Ast): LessThanOrEqualOpAst => ({
  kind: AstNodeType.LESS_THAN_OR_EQUAL_OP,
  left,
  right,
})

export interface PlusOpAst extends BinaryOpAst {
  kind: AstNodeType.PLUS_OP,
}

export const buildPlusOpAst = (left: Ast, right: Ast): PlusOpAst => ({
  kind: AstNodeType.PLUS_OP,
  left,
  right,
})

export interface MinusOpAst extends BinaryOpAst {
  kind: AstNodeType.MINUS_OP,
}

export const buildMinusOpAst = (left: Ast, right: Ast): MinusOpAst => ({
  kind: AstNodeType.MINUS_OP,
  left,
  right,
})

export interface MinusUnaryOpAst {
  kind: AstNodeType.MINUS_UNARY_OP,
  value: Ast,
}

export const buildMinusUnaryOpAst = (value: Ast): MinusUnaryOpAst => ({
  kind: AstNodeType.MINUS_UNARY_OP,
  value,
})

export interface TimesOpAst extends BinaryOpAst {
  kind: AstNodeType.TIMES_OP,
}

export const buildTimesOpAst = (left: Ast, right: Ast): TimesOpAst => ({
  kind: AstNodeType.TIMES_OP,
  left,
  right,
})

export interface DivOpAst extends BinaryOpAst {
  kind: AstNodeType.DIV_OP,
}

export const buildDivOpAst = (left: Ast, right: Ast): DivOpAst => ({
  kind: AstNodeType.DIV_OP,
  left,
  right,
})

export interface PowerOpAst extends BinaryOpAst {
  kind: AstNodeType.POWER_OP,
}

export const buildPowerOpAst = (left: Ast, right: Ast): PowerOpAst => ({
  kind: AstNodeType.POWER_OP,
  left,
  right,
})

export interface ProcedureAst {
  kind: AstNodeType.FUNCTION_CALL,
  procedureName: string,
  args: Ast[]
}

export const buildProcedureAst = (procedureName: string, args: Ast[]): ProcedureAst => ({
  kind: AstNodeType.FUNCTION_CALL,
  procedureName,
  args,
})

export interface ErrorAst {
  kind: AstNodeType.ERROR,
  args: ParsingError[]
}

export const buildErrorAst = (args: ParsingError[]): ErrorAst => ({kind: AstNodeType.ERROR, args})
