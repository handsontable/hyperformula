import {CellAddress} from "../Vertex"

export type TemplateAst = NumberAst | StringAst | CellReferenceAst | CellRangeAst | PlusOpAst | MinusOpAst | TimesOpAst | DivOpAst | ProcedureAst | ErrorAst;
export type CellDependency = CellAddress | [CellAddress, CellAddress]
export interface Ast {
  ast: TemplateAst,
  addresses: Array<CellDependency>,
}
export type ParsingError = {
  name: string,
  message: string
}

export enum AstNodeType {
  NUMBER = "NUMBER",
  STRING = "STRING",

  PLUS_OP = "PLUS_OP",
  MINUS_OP = "MINUS_OP",
  TIMES_OP = "TIMES_OP",
  DIV_OP = "DIV_OP",

  FUNCTION_CALL = "FUNCTION_CALL",

  CELL_REFERENCE = "CELL_REFERENCE",
  CELL_RANGE = "CELL_RANGE",

  ERROR = "ERROR"
}

export interface NumberAst {
  type: AstNodeType.NUMBER,
  value: number,
}
export const buildNumberAst = (value: number): NumberAst => ({ type: AstNodeType.NUMBER, value })

export interface StringAst {
  type: AstNodeType.STRING,
  value: string,
}
export const buildStringAst = (value: string): StringAst => ({ type: AstNodeType.STRING, value })

export interface CellReferenceAst {
  type: AstNodeType.CELL_REFERENCE,
  idx: number,
}
export const buildCellReferenceAst = (idx: number): CellReferenceAst => ({ type: AstNodeType.CELL_REFERENCE, idx })

export interface CellRangeAst {
  type: AstNodeType.CELL_RANGE,
  idx: number,
}
export const buildCellRangeAst = (idx: number): CellRangeAst => ({ type: AstNodeType.CELL_RANGE, idx })

export interface BinaryOpAst {
  left: TemplateAst,
  right: TemplateAst,
}

export interface PlusOpAst extends BinaryOpAst {
  type: AstNodeType.PLUS_OP,
}
export const buildPlusOpAst = (left: TemplateAst, right: TemplateAst): PlusOpAst => ({ type: AstNodeType.PLUS_OP, left, right })

export interface MinusOpAst extends BinaryOpAst {
  type: AstNodeType.MINUS_OP,
}
export const buildMinusOpAst = (left: TemplateAst, right: TemplateAst): MinusOpAst => ({ type: AstNodeType.MINUS_OP, left, right })

export interface TimesOpAst extends BinaryOpAst {
  type: AstNodeType.TIMES_OP,
}
export const buildTimesOpAst = (left: TemplateAst, right: TemplateAst): TimesOpAst => ({ type: AstNodeType.TIMES_OP, left, right })

export interface DivOpAst extends BinaryOpAst {
  type: AstNodeType.DIV_OP,
}
export const buildDivOpAst = (left: TemplateAst, right: TemplateAst): DivOpAst => ({ type: AstNodeType.DIV_OP, left, right })

export interface ProcedureAst {
  type: AstNodeType.FUNCTION_CALL,
  procedureName: string,
  args: TemplateAst[]
}
export const buildProcedureAst = (procedureName: string, args: TemplateAst[]): ProcedureAst => ({ type: AstNodeType.FUNCTION_CALL, procedureName, args })

export interface ErrorAst {
  type: AstNodeType.ERROR,
  args: ParsingError[]
}
export const buildErrorAst = (args: ParsingError[]): ErrorAst => ({type : AstNodeType.ERROR, args: args })

