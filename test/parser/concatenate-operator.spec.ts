import {absoluteCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {AstNodeType, ConcatenateOpAst, ProcedureAst} from '../../src/parser/Ast'
import {ParserWithCaching} from '../../src/parser/ParserWithCaching'

describe('Parser - Concatenate operators', () => {
  it('Greater than operator', () => {
    const parser = new ParserWithCaching(new Config())

    const ast = parser.parse('="a"&"b"', absoluteCellAddress(0, 0)).ast as ConcatenateOpAst
    expect(ast.type).toBe(AstNodeType.CONCATENATE_OP)
    expect(ast.left.type).toBe(AstNodeType.STRING)
    expect(ast.left.type).toBe(AstNodeType.STRING)
  })

  it('Greater than operator as function parameter', () => {
    const parser = new ParserWithCaching(new Config())

    const ast = parser.parse('=CONCATENATE("="&A6,"foo")', absoluteCellAddress(0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.args[0].type).toBe(AstNodeType.CONCATENATE_OP)
  })
})
