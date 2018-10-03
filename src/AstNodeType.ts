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


export abstract class Ast {}

export class BinaryOpAst extends Ast {
  args: Array<Ast>
  constructor(args : Array<Ast>) {
    super()
    this.args = args
  }

  left() {
    return this.args[0]
  }

  right() {
    return this.args[1]
  }
}

export class PlusOpAst extends BinaryOpAst {}
export class MinusOpAst extends BinaryOpAst {}
export class TimesOpAst extends BinaryOpAst {}
export class DivOpAst extends BinaryOpAst {}

export class RelativeCellAst extends Ast {
  args: Array<string>
  constructor(args : Array<string>) {
    super()
    this.args = args
  }

  getAddress() : string {
    return this.args[0]
  }
}

export class NumberAst extends Ast {
  args: Array<string>
  constructor(args : Array<string>) {
    super()
    this.args = args
  }

  getValue() : number {
    return parseInt(this.args[0])
  }
}
