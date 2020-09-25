import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {AstNodeType, ConcatenateOpAst, ProcedureAst} from '../../src/parser'
import {buildEmptyParserWithCaching} from './common'

describe('Parser - Concatenate operators', () => {
  it('Greater than operator', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('="a"&"b"', simpleCellAddress(0, 0, 0)).ast as ConcatenateOpAst
    expect(ast.type).toBe(AstNodeType.CONCATENATE_OP)
    expect(ast.left.type).toBe(AstNodeType.STRING)
    expect(ast.left.type).toBe(AstNodeType.STRING)
  })

  it('Greater than operator as function parameter', () => {
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=CONCATENATE("="&A6,"foo")', simpleCellAddress(0, 0, 0)).ast as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.args[0]!.type).toBe(AstNodeType.CONCATENATE_OP)
  })
})
