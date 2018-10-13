import {Ast} from "./Ast";

export type TemplateAst = NumberAst | CellReferenceAst | PlusOpAst | MinusOpAst | TimesOpAst | DivOpAst | ProcedureAst;
export interface BetterAst {
  ast: TemplateAst,
  addresses: Array<string>,
}

export enum AstNodeType {
  NUMBER = "NUMBER",

  PLUS_OP = "PLUS_OP",
  MINUS_OP = "MINUS_OP",
  TIMES_OP = "TIMES_OP",
  DIV_OP = "DIV_OP",

  FUNCTION_CALL = "FUNCTION_CALL",

  CELL_REFERENCE = "CELL_REFERENCE",
}

export interface NumberAst {
  type: AstNodeType.NUMBER,
  value: number,
}
export const buildNumberAst = (value: number): NumberAst => ({ type: AstNodeType.NUMBER, value })

export interface CellReferenceAst {
  type: AstNodeType.CELL_REFERENCE,
  idx: number,
}
export const buildCellReferenceAst = (idx: number): CellReferenceAst => ({ type: AstNodeType.CELL_REFERENCE, idx })

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

