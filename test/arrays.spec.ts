import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('OPs', () => {
  it('unary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=SUM(-A1:C1)']], {arrays: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('binary op', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],[4,5,6],['=SUM(2*A1:C1+A2:C2)']], {arrays: true})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('index', () => {
    const engine = HyperFormula.buildFromArray([[1,2,3],['=INDEX(2*A1:C1+3,1,1)']], {arrays: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })
})
