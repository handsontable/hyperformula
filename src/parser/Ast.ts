export abstract class Ast {}

export class BinaryOpAst extends Ast {
  private leftNode: Ast;
  private rightNode: Ast;

  constructor(left: Ast, right: Ast) {
    super()
    this.leftNode = left
    this.rightNode = right
  }

  left() {
    return this.leftNode
  }

  right() {
    return this.rightNode
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
  private value: string

  constructor(value: string) {
    super()
    this.value = value
  }

  getValue() : number {
    return parseInt(this.value)
  }
}
