import { ErrorType, simpleCellAddress } from '../../src/Cell'
import { Config } from '../../src/Config'
import { CellRangeAst } from '../../src/parser'
import { buildEmptyParserWithCaching } from '../parser/common'
import { adr } from '../testUtils'
import { ParenthesisAst, ProcedureAst, ErrorAst } from '../../src/parser/Ast'
import { RowsSpan } from '../../src/Span'
import { RemoveRowsTransformer } from '../../src/dependencyTransformers/RemoveRowsTransformer'

describe('RemoveRowsTransformer', () => {

  it('transformRowRange error - removing rows from top of range', () => {
    const transformer = new RemoveRowsTransformer(new RowsSpan(0, 0, 2))
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

    const [transformedAst, cellAddress] = transformer.transformSingleAst(ast, simpleCellAddress(0, 0, 0))

    {
      const astParen = transformedAst as ParenthesisAst
      const astSum = astParen.expression as ProcedureAst
      const astSumError = astSum.args[0] as ErrorAst
      expect(astSumError.type).toEqual(ErrorType.ERROR)
      expect(astSumError.error.type).toEqual(ErrorType.REF)
      expect(cellAddress.sheet).toEqual(0)
      expect(cellAddress.col).toEqual(0)
      expect(cellAddress.row).toEqual(-3)
    }

  })

})
