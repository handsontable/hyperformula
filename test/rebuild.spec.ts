import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('Rebuilding engine', () => {
  it('should preserve named expression', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('TRUE', '=TRUE()')
    engine.addNamedExpression('FALSE', '=FALSE()')
    engine.setCellContents(adr('A1'), '=FALSE')
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })
})
