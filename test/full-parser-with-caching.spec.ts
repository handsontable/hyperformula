import {ParserWithCaching, computeHashAndExtractAddresses} from '../src/parser/ParserWithCaching'
import { tokenizeFormula } from '../src/parser/FormulaParser'
import {AstNodeType, NumberAst, PlusOpAst, MinusOpAst, TimesOpAst, CellReferenceAst} from '../src/parser/BetterAst'

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
});
