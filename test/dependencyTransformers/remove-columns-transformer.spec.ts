import { simpleCellAddress } from '../../src/Cell'
import { Config } from '../../src/Config'
import { CellRangeAst } from '../../src/parser'
import { buildEmptyParserWithCaching } from '../parser/common'
import { adr } from '../testUtils'
import { ParenthesisAst, ProcedureAst } from '../../src/parser/Ast'
import { ColumnsSpan } from '../../src/Span'
import { RemoveColumnsTransformer } from '../../src/dependencyTransformers/RemoveColumnsTransformer'

describe('RemoveColumnsTransformer', () => {

  it('transformColRange error - removing cols from left of range throws error', () => {
    const transformer = new RemoveColumnsTransformer(new ColumnsSpan(0, 5, 5))
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=(SUM(C2:F7))', adr('A1', 1)).ast

    {
      const astParen = ast as ParenthesisAst
      const astSum = astParen.expression as ProcedureAst
      const astSumArg = astSum.args[0] as CellRangeAst
      expect(astSumArg.start.sheet).toBeUndefined()
      expect(astSumArg.start.col).toEqual(2)
      expect(astSumArg.start.row).toEqual(1)
      expect(astSumArg.end.sheet).toBeUndefined()
      expect(astSumArg.end.col).toEqual(5)
      expect(astSumArg.end.row).toEqual(6)
    }

    expect(() => {
      transformer.transformSingleAst(ast, simpleCellAddress(0, 5, 5))
    }).toThrowError('Cannot happen')

  })

})
