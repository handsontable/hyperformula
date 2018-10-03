import {FullParser} from '../src/parser/FullParser'
import {PlusOpAst, MinusOpAst, NumberAst, RelativeCellAst} from "../src/parser/Ast"

describe('Full parser test', () => {
  const parser = new FullParser()

  it("integer literal", () => {
    const ast = parser.parse("42") as NumberAst

    expect(ast).toBeInstanceOf(NumberAst)
    expect(ast.getValue()).toBe(42)
  })

  it("plus operator on literals", () => {
    const ast = parser.parse("1+2") as PlusOpAst

    expect(ast).toBeInstanceOf(PlusOpAst)
    expect(ast.left()).toBeInstanceOf(NumberAst)
    expect(ast.right()).toBeInstanceOf(NumberAst)
  })

  it("plus operator on different nodes", () => {
    const ast = parser.parse("1+A5") as PlusOpAst

    expect(ast).toBeInstanceOf(PlusOpAst)
    expect(ast.left()).toBeInstanceOf(NumberAst)
    expect(ast.right()).toBeInstanceOf(RelativeCellAst)
  })

  it("minus operator on different nodes", () => {
    const ast = parser.parse("1-A5") as MinusOpAst

    expect(ast).toBeInstanceOf(MinusOpAst)
    expect(ast.left()).toBeInstanceOf(NumberAst)
    expect(ast.right()).toBeInstanceOf(RelativeCellAst)
  })

  it("relative cell reference", () => {
    const ast = parser.parse("A5") as RelativeCellAst

    expect(ast).toBeInstanceOf(RelativeCellAst)
    expect(ast.getAddress()).toBe("A5")
  })
})
