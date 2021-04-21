import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('scoped named expressions', () => {
  it('should be removed when sheet is removed', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[]], 'Sheet2': [[]]})
    engine.addNamedExpression('TRUE', true, 'Sheet1')
    // @ts-ignore
    expect(engine._namedExpressions.getAllNamedExpressionsNames()).toEqual(['TRUE'])
    engine.removeSheet('Sheet1')
    // @ts-ignore
    expect(engine._namedExpressions.getAllNamedExpressionsNames()).toEqual([])
  })

  it('removal should work with undo', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE']])
    engine.addNamedExpression('TRUE', true, 'Sheet1')
    engine.removeSheet('Sheet1')
    engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })
})
