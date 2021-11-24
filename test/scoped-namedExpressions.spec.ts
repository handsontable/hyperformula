import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('scoped named expressions', () => {
  it('should be removed when sheet is removed', async() => {
const engine = await HyperFormula.buildFromSheets({'Sheet1': [[]], 'Sheet2': [[]]})
    await engine.addNamedExpression('TRUE', true, 0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(engine._namedExpressions.getAllNamedExpressionsNames()).toEqual(['TRUE'])
    await engine.removeSheet(0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(engine._namedExpressions.getAllNamedExpressionsNames()).toEqual([])
  })

  it('removal should work with undo of sheet', async() => {
const engine = await HyperFormula.buildFromArray([['=TRUE']])
    await engine.addNamedExpression('TRUE', true, 0)
    await engine.removeSheet(0)
    await engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('removal should work with undo of named expression', async() => {
const engine = await HyperFormula.buildFromArray([['=TRUE']])
    await engine.addNamedExpression('TRUE', true, 0)
    await engine.removeNamedExpression('TRUE', 0)
    await engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })
})
