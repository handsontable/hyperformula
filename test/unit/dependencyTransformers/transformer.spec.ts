import { ErrorType, simpleCellAddress, SimpleCellAddress } from '../../src/Cell'
import { Config } from '../../src/Config'
import { CellAddress, CellRangeAst } from '../../src/parser'
import { ColumnAddress } from '../../src/parser/ColumnAddress'
import { RowAddress } from '../../src/parser/RowAddress'
import { Transformer } from '../../src/dependencyTransformers/Transformer'
import { buildEmptyParserWithCaching } from '../parser/common'
import { adr } from '../testUtils'
import { ParenthesisAst, ProcedureAst, ArrayAst } from '../../src/parser/Ast'

describe('Transformer', () => {

  /**
   * A mock Transformer subclass that can be used to test the methods implemented in the partially abstract Transform class
   */
  class MockTransformer extends Transformer {
    constructor() {
      super()
    }
    public get sheet(): number {
      return 0
    }
    public isIrreversible(): boolean {
      return false
    }
    protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): T | ErrorType.REF | false {
      return ErrorType.REF
    }
    protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): [CellAddress, CellAddress] | ErrorType.REF | false {
      const newStart = new CellAddress(15, 10, start.type, 19)
      const newEnd = new CellAddress(20, 30, start.type, 19)
      return [newStart, newEnd]
    }
    protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): [RowAddress, RowAddress] | ErrorType.REF | false {
      return ErrorType.REF
    }
    protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): [ColumnAddress, ColumnAddress] | ErrorType.REF | false {
      return ErrorType.REF
    }
    protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
      return simpleCellAddress(19, 12, 50)
    }
  }

  it('transformSingleAst - type PARENTHESIS', () => {
    const transformer = new MockTransformer()
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('=(SUM(C2:F7))', adr('A1')).ast

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

    const [transformedAst, cellAddress] = transformer.transformSingleAst(ast, simpleCellAddress(0, 2, 2))

    {
      const astParen = transformedAst as ParenthesisAst
      const astSum = astParen.expression as ProcedureAst
      const astSumArg = astSum.args[0] as CellRangeAst
      expect(astSumArg.start.sheet).toEqual(19)
      expect(astSumArg.start.col).toEqual(15)
      expect(astSumArg.start.row).toEqual(10)
      expect(astSumArg.end.sheet).toEqual(19)
      expect(astSumArg.end.col).toEqual(20)
      expect(astSumArg.end.row).toEqual(30)
      expect(cellAddress.sheet).toEqual(19)
      expect(cellAddress.col).toEqual(12)
      expect(cellAddress.row).toEqual(50)
    }

  })

  it('transformSingleAst - type ARRAY', () => {
    const transformer = new MockTransformer()
    const parser = buildEmptyParserWithCaching(new Config())

    const ast = parser.parse('={SUM(C2:F7)}', adr('A1')).ast

    {
      const astArray = ast as ArrayAst
      const astSum = astArray.args[0][0] as ProcedureAst
      const astSumArg = astSum.args[0] as CellRangeAst
      expect(astSumArg.start.sheet).toBeUndefined()
      expect(astSumArg.start.col).toEqual(2)
      expect(astSumArg.start.row).toEqual(1)
      expect(astSumArg.end.sheet).toBeUndefined()
      expect(astSumArg.end.col).toEqual(5)
      expect(astSumArg.end.row).toEqual(6)
    }

    const [transformedAst, cellAddress] = transformer.transformSingleAst(ast, simpleCellAddress(0, 2, 2))

    {
      const astArray = transformedAst as ArrayAst
      const astSum = astArray.args[0][0] as ProcedureAst
      const astSumArg = astSum.args[0] as CellRangeAst
      expect(astSumArg.start.sheet).toEqual(19)
      expect(astSumArg.start.col).toEqual(15)
      expect(astSumArg.start.row).toEqual(10)
      expect(astSumArg.end.sheet).toEqual(19)
      expect(astSumArg.end.col).toEqual(20)
      expect(astSumArg.end.row).toEqual(30)
      expect(cellAddress.sheet).toEqual(19)
      expect(cellAddress.col).toEqual(12)
      expect(cellAddress.row).toEqual(50)
    }

  })

})
