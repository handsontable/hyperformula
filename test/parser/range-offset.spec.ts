import {Config} from '../../src'
import {SheetMapping} from '../../src/DependencyGraph'
import {AstNodeType, CellRangeAst, ErrorAst, ParserWithCaching, ParsingErrorType} from '../../src/parser'
import {CellAddress} from '../../src/parser'

describe('Parser - range offset', () => {
  it('OFFSET - usage with range', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const ast = parser.parse('=A1:OFFSET(A1, 1, 1, 1, 1)', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst
    const ast2 = parser.parse('=OFFSET(A1, 1, 1, 1, 1):OFFSET(B2, 1, 1, 1, 1)', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst
    const ast3 = parser.parse('=OFFSET(A1, 1, 1, 1, 1):B3', CellAddress.absolute(0, 0, 0)).ast as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast2.type).toBe(AstNodeType.CELL_RANGE)
    expect(ast3.type).toBe(AstNodeType.CELL_RANGE)
  })

  it('OFFSET - range offset not allowed', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)

    const ast = parser.parse('=A1:OFFSET(B2, 0, 0, 2, 2)', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    const ast2 = parser.parse('=OFFSET(A1,0,0,2,2):A2', CellAddress.absolute(0, 0, 0)).ast as ErrorAst

    expect(ast.args[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
    expect(ast2.args[0].type).toBe(ParsingErrorType.RangeOffsetNotAllowed)
  })
})
