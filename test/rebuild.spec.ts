import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('Rebuilding engine', () => {
  it('should preserve absolute named expression', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE']])
    engine.addNamedExpression('FALSE', '=FALSE()')
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('should preserve local named expression', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE']])
    engine.addNamedExpression('FALSE', '=FALSE()', 'Sheet1')
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })
})
