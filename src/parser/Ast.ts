export type Ast = NumberAst | RelativeCellAst | PlusOpAst | MinusOpAst | TimesOpAst;

export enum Kinds {
  NUMBER = "NUMBER",

  RELATIVE_CELL = "RELATIVE_CELL",

  PLUS_OP = "PLUS_OP",
  MINUS_OP = "MINUS_OP",
  TIMES_OP = "TIMES_OP"
}

export interface NumberAst {
  kind: Kinds.NUMBER,
  value: number,
}
export const buildNumberAst = (value: number): NumberAst => ({ kind: Kinds.NUMBER, value })

export interface RelativeCellAst {
  kind: Kinds.RELATIVE_CELL,
  address: string,
}
export const buildRelativeCellAst = (address: string): RelativeCellAst => ({ kind: Kinds.RELATIVE_CELL, address })

export interface BinaryOpAst {
  left: Ast,
  right: Ast,
}

export interface PlusOpAst extends BinaryOpAst {
  kind: Kinds.PLUS_OP,
}
export const buildPlusOpAst = (left: Ast, right: Ast): PlusOpAst => ({ kind: Kinds.PLUS_OP, left, right })

export interface MinusOpAst extends BinaryOpAst {
  kind: Kinds.MINUS_OP,
}
export const buildMinusOpAst = (left: Ast, right: Ast): MinusOpAst => ({ kind: Kinds.MINUS_OP, left, right })

export interface TimesOpAst extends BinaryOpAst {
  kind: Kinds.TIMES_OP,
}
export const buildTimesOpAst = (left: Ast, right: Ast): TimesOpAst => ({ kind: Kinds.TIMES_OP, left, right })
