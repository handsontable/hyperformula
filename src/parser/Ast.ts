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
  private address: string

  constructor(address: string) {
    super()
    this.address = address
  }

  getAddress() : string {
    return this.address
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
