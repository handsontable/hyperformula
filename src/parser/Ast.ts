export type Ast = NumberAst | RelativeCellAst | PlusOpAst | MinusOpAst | TimesOpAst;

export enum AstNodeType {
  NUMBER = "NUMBER",
  STRING = "STRING",

  PLUS_OP = "PLUS_OP",
  MINUS_OP = "MINUS_OP",
  TIMES_OP = "TIMES_OP",
  DIV_OP = "DIV_OP",
  POW_OP = "POW_OP",
  NEGATIVE_OP = "NEGATIVE_OP",
  POSITIVE_OP = "POSITIVE_OP",
  AND_OP = "AND_OP",

  FUNCTION_CALL = "FUNCTION_CALL",

  RELATIVE_CELL = "RELATIVE_CELL",
  ABSOLUTE_CELL = "ABSOLUTE_CELL",
  MIXED_CELL = "MIXED_CELL",

  CELL_RANGE = "CELL_RANGE",

  ARRAY = "ARRAY"
}

export interface NumberAst {
  kind: AstNodeType.NUMBER,
  value: number,
}
export const buildNumberAst = (value: number): NumberAst => ({ kind: AstNodeType.NUMBER, value })

export interface RelativeCellAst {
  kind: AstNodeType.RELATIVE_CELL,
  address: string,
}
export const buildRelativeCellAst = (address: string): RelativeCellAst => ({ kind: AstNodeType.RELATIVE_CELL, address })

export interface BinaryOpAst {
  left: Ast,
  right: Ast,
}

export interface PlusOpAst extends BinaryOpAst {
  kind: AstNodeType.PLUS_OP,
}
export const buildPlusOpAst = (left: Ast, right: Ast): PlusOpAst => ({ kind: AstNodeType.PLUS_OP, left, right })

export interface MinusOpAst extends BinaryOpAst {
  kind: AstNodeType.MINUS_OP,
}
export const buildMinusOpAst = (left: Ast, right: Ast): MinusOpAst => ({ kind: AstNodeType.MINUS_OP, left, right })

export interface TimesOpAst extends BinaryOpAst {
  kind: AstNodeType.TIMES_OP,
}
export const buildTimesOpAst = (left: Ast, right: Ast): TimesOpAst => ({ kind: AstNodeType.TIMES_OP, left, right })
