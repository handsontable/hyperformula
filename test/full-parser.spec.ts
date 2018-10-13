import {FullParser} from '../src/parser/FullParser'
import {
  AstNodeType,
  NumberAst,
  PlusOpAst,
  MinusOpAst,
  TimesOpAst,
  RelativeCellAst,
  ProcedureAst
} from '../src/parser/Ast'

describe('Full parser test', () => {
  const parser = new FullParser()

  it("integer literal", () => {
    const ast = parser.parse("=42") as NumberAst

    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
  })

  it("float literal", () => {
    const ast = parser.parse("=3.14") as NumberAst

    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(3.14)
  })

  it("leading zeros", () => {
    const int = parser.parse("=01234") as NumberAst
    const float = parser.parse("=03.14") as NumberAst

    expect(int.type).toBe(AstNodeType.NUMBER)
    expect(int.value).toBe(1234)
    expect(float.type).toBe(AstNodeType.NUMBER)
    expect(float.value).toBe(3.14)
  })

  it("plus operator on literals", () => {
    const ast = parser.parse("=1+2") as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it("plus operator on mixed number literals", () => {
    const ast = parser.parse("=2 + 3.14") as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it("plus operator on different nodes", () => {
    const ast = parser.parse("=1+A5") as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.RELATIVE_CELL)
  })

  it("minus operator on different nodes", () => {
    const ast = parser.parse("=1-A5") as MinusOpAst

    expect(ast.type).toBe(AstNodeType.MINUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.RELATIVE_CELL)
  })

  it("times operator on different nodes", () => {
    const ast = parser.parse("=1*A5") as TimesOpAst

    expect(ast.type).toBe(AstNodeType.TIMES_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.RELATIVE_CELL)
  })

  it.skip("joining nodes without braces", () => {
    const ast = parser.parse("=1 + 2 + 3") as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it("joining nodes with braces", () => {
    const ast = parser.parse("=1 + (2 + 3)") as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.PLUS_OP)
  })

  it("relative cell reference", () => {
    const ast = parser.parse("=A5") as RelativeCellAst

    expect(ast.type).toBe(AstNodeType.RELATIVE_CELL)
    expect(ast.address).toBe("A5")
  })

  it("SUM function without args", () => {
    const ast = parser.parse("=SUM()") as ProcedureAst

    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe("SUM")
    expect(ast.args.length).toBe(0)
  })

  it("SUM function with args", () => {
    const ast = parser.parse("=SUM(1; A1)") as ProcedureAst

    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe("SUM")
    expect(ast.args[0].type).toBe(AstNodeType.NUMBER)
    expect(ast.args[1].type).toBe(AstNodeType.RELATIVE_CELL)
  })
})
