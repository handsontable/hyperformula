import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('scoped named expressions', () => {
  it('should be removed when sheet is removed', () => {
    const [engine] = HyperFormula.buildFromSheets({'Sheet1': [[]], 'Sheet2': [[]]})
    engine.addNamedExpression('TRUE', true, 0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(engine._namedExpressions.getAllNamedExpressionsNames()).toEqual(['TRUE'])
    engine.removeSheet(0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(engine._namedExpressions.getAllNamedExpressionsNames()).toEqual([])
  })

  it('removal should work with undo of sheet', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRUE']])
    engine.addNamedExpression('TRUE', true, 0)
    engine.removeSheet(0)
    engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('removal should work with undo of named expression', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRUE']])
    engine.addNamedExpression('TRUE', true, 0)
    engine.removeNamedExpression('TRUE', 0)
    engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })
})
