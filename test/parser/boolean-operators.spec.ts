import {absoluteCellAddress, relativeCellAddress} from '../../src/Cell'
import {AstNodeType, CellReferenceAst} from '../../src/parser/Ast'
import {ParserWithCaching} from '../../src/parser/ParserWithCaching'

describe('Parser - Boolean operators', () => {
  it('Equals operator', () => {
    const parser = new ParserWithCaching('parser')

    const ast = parser.parse('=1=2', absoluteCellAddress(0, 0)).ast as CellReferenceAst

    expect(ast.type).toBe(AstNodeType.EQUALS_OP)
  })
})
