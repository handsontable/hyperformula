import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('OPs', () => {
  it('unary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=SUM(-A1:C1)']])
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })
})
