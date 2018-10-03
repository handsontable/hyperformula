import {FullParser} from '../src/parser/FullParser'
import { AstNodeType, NumberAst, PlusOpAst, MinusOpAst, TimesOpAst, RelativeCellAst } from '../src/parser/Ast'

describe('Full parser test', () => {
  const parser = new FullParser()

  it("integer literal", () => {
    const ast = parser.parse("42") as NumberAst

    expect(ast.kind).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
  })

  it("plus operator on literals", () => {
    const ast = parser.parse("1+2") as PlusOpAst

    expect(ast.kind).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.kind).toBe(AstNodeType.NUMBER)
    expect(ast.right.kind).toBe(AstNodeType.NUMBER)
  })

  it("plus operator on different nodes", () => {
    const ast = parser.parse("1+A5") as PlusOpAst

    expect(ast.kind).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.kind).toBe(AstNodeType.NUMBER)
    expect(ast.right.kind).toBe(AstNodeType.RELATIVE_CELL)
  })

  it("minus operator on different nodes", () => {
    const ast = parser.parse("1-A5") as MinusOpAst

    expect(ast.kind).toBe(AstNodeType.MINUS_OP)
    expect(ast.left.kind).toBe(AstNodeType.NUMBER)
    expect(ast.right.kind).toBe(AstNodeType.RELATIVE_CELL)
  })

  it("times operator on different nodes", () => {
    const ast = parser.parse("1*A5") as TimesOpAst

    expect(ast.kind).toBe(AstNodeType.TIMES_OP)
    expect(ast.left.kind).toBe(AstNodeType.NUMBER)
    expect(ast.right.kind).toBe(AstNodeType.RELATIVE_CELL)
  })

  it("joining nodes without braces", () => {
    const ast = parser.parse("1 + 2 + 3") as PlusOpAst

    expect(ast.kind).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.kind).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.kind).toBe(AstNodeType.NUMBER)
  })

  it("joining nodes with braces", () => {
    const ast = parser.parse("1 + (2 + 3)") as PlusOpAst

    expect(ast.kind).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.kind).toBe(AstNodeType.NUMBER)
    expect(ast.right.kind).toBe(AstNodeType.PLUS_OP)
  })

  it("relative cell reference", () => {
    const ast = parser.parse("A5") as RelativeCellAst

    expect(ast.kind).toBe(AstNodeType.RELATIVE_CELL)
    expect(ast.address).toBe("A5")
  })
})
