import {ParserWithCaching, computeHashAndExtractAddresses} from '../src/parser/FullParser'
import { tokenizeFormula } from '../src/parser/FormulaParser'
import { AstNodeType, NumberAst, PlusOpAst, MinusOpAst, TimesOpAst, RelativeCellAst } from '../src/parser/Ast'

describe('ParserWithCaching', () => {
  const parser = new ParserWithCaching()

  it("integer literal", () => {
    const bast = parser.parse("=42")
    const ast = bast.ast as NumberAst

    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
    expect(bast.addresses).toEqual([])
  })

  it("plus operator on different nodes", () => {
    const bast = parser.parse("=1+A5")
    const ast = bast.ast as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.RELATIVE_CELL)
    expect(bast.addresses).toEqual(["A5"])
  })

  it("plus operator on different nodes with more addresses", () => {
    const bast = parser.parse("=A6+A5")
    const ast = bast.ast as PlusOpAst

    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.RELATIVE_CELL)
    expect(ast.right.type).toBe(AstNodeType.RELATIVE_CELL)
    expect(bast.addresses).toEqual(["A6", "A5"])
  })
});
