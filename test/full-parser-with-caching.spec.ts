import {ParserWithCaching, computeHashAndExtractAddresses} from '../src/parser/ParserWithCaching'
import { tokenizeFormula } from '../src/parser/FormulaParser'
import {AstNodeType, NumberAst, PlusOpAst, MinusOpAst, TimesOpAst, CellReferenceAst, ProcedureAst} from '../src/parser/BetterAst'

describe('ParserWithCaching', () => {
  it("integer literal", () => {
    const parser = new ParserWithCaching()

    const bast = parser.parse("=42")

    const ast = bast.ast as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
    expect(bast.addresses).toEqual([])
  })

  it("plus operator on different nodes", () => {
    const parser = new ParserWithCaching()

    const bast = parser.parse("=1+A5")

    const ast = bast.ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(bast.addresses).toEqual(["A5"])
  })

  it("plus operator on different nodes with more addresses", () => {
    const parser = new ParserWithCaching()

    const bast = parser.parse("=A6+A5")

    const ast = bast.ast as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(ast.right.type).toBe(AstNodeType.CELL_REFERENCE)
    expect(bast.addresses).toEqual(["A6", "A5"])
  })

  it("it use cache for similar formulas", () => {
    const parser = new ParserWithCaching()

    const bast1 = parser.parse("=A1")
    const bast2 = parser.parse("=A2")

    expect(bast1.ast).toEqual(bast2.ast)
    expect(parser.statsCacheUsed).toBe(1)
  })

  it("doesn't count cache for different formulas", () => {
    const parser = new ParserWithCaching()

    const bast1 = parser.parse("=A1")
    const bast2 = parser.parse("=A2+A3")

    expect(parser.statsCacheUsed).toBe(0)
  })

  it("SUM function without args", () => {
    const parser = new ParserWithCaching()

    const bast = parser.parse("=SUM()")
    const ast = bast.ast as ProcedureAst

    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe("SUM")
    expect(ast.args.length).toBe(0)
  })

  it("SUM function with args", () => {
    const parser = new ParserWithCaching()

    const bast = parser.parse("=SUM(1; A1)")
    const ast = bast.ast as ProcedureAst

    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe("SUM")
    expect(ast.args[0].type).toBe(AstNodeType.NUMBER)
    expect(ast.args[1].type).toBe(AstNodeType.CELL_REFERENCE)
  })


  it.skip("joining nodes without braces", () => {
    const parser = new ParserWithCaching()
    const ast = parser.parse("=1 + 2 + 3").ast as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it("joining nodes with braces", () => {
    const parser = new ParserWithCaching()
    const ast = parser.parse("=1 + (2 + 3)").ast as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.PLUS_OP)
  })


  it("float literal", () => {
    const parser = new ParserWithCaching()

    const ast = parser.parse("=3.14").ast as NumberAst

    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(3.14)
  })

  it("leading zeros", () => {
    const parser = new ParserWithCaching()

    const int = parser.parse("=01234").ast as NumberAst
    const float = parser.parse("=03.14").ast as NumberAst

    expect(int.type).toBe(AstNodeType.NUMBER)
    expect(int.value).toBe(1234)
    expect(float.type).toBe(AstNodeType.NUMBER)
    expect(float.value).toBe(3.14)
  })

});
