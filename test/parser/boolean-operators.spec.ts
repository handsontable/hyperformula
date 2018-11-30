import {absoluteCellAddress} from '../../src/Cell'
import {AstNodeType, EqualsOpAst, GreaterThanOpAst, LessThanOpAst} from '../../src/parser/Ast'
import {ParserWithCaching} from '../../src/parser/ParserWithCaching'

describe('Parser - Boolean operators', () => {
  it('Equals operator', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=1=2', absoluteCellAddress(0, 0)).ast as EqualsOpAst

    expect(ast.type).toBe(AstNodeType.EQUALS_OP)
  })

  it('Greater than operator', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=1>2', absoluteCellAddress(0, 0)).ast as GreaterThanOpAst

    expect(ast.type).toBe(AstNodeType.GREATER_THAN_OP)
  })

  it('Less than operator', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=1<2', absoluteCellAddress(0, 0)).ast as LessThanOpAst

    expect(ast.type).toBe(AstNodeType.LESS_THAN_OP)
  })

  it('Boolean operator with more complex childs', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=1+2=1+2*6', absoluteCellAddress(0, 0)).ast as EqualsOpAst

    expect(ast.type).toBe(AstNodeType.EQUALS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.PLUS_OP)
  })
})
