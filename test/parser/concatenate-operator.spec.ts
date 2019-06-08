import {CellAddress} from '../../src/parser/CellAddress'
import {Config} from '../../src/Config'
import {AstNodeType, ConcatenateOpAst, ParserWithCaching, ProcedureAst} from '../../src/parser'
import {SheetMapping} from '../../src/SheetMapping'

describe('Parser - Concatenate operators', () => {
  it('Greater than operator', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const ast = parser.parse('="a"&"b"', CellAddress.absolute(0, 0, 0)).ast as ConcatenateOpAst
    expect(ast.type).toBe(AstNodeType.CONCATENATE_OP)
    expect(ast.left.type).toBe(AstNodeType.STRING)
    expect(ast.left.type).toBe(AstNodeType.STRING)
  })

  it('Greater than operator as function parameter', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const ast = parser.parse('=CONCATENATE("="&A6,"foo")', CellAddress.absolute(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.args[0].type).toBe(AstNodeType.CONCATENATE_OP)
  })
})
