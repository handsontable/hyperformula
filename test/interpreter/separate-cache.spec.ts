import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('numeric aggreagtion functions', () => {
  it('should use separate caches', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, 5, 10, 20],
      ['=MIN(A1:E1)', '=MAX(A1:E1)', '=SUM(A1:E1)', '=SUMSQ(A1:E1)', '=AVERAGE(A1:E1)'],
      ['=MIN(A1:E1)', '=MAX(A1:E1)', '=SUM(A1:E1)', '=SUMSQ(A1:E1)', '=AVERAGE(A1:E1)'],
    ])
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('B3'))).toEqual(20)
    expect(engine.getCellValue(adr('C3'))).toEqual(38)
    expect(engine.getCellValue(adr('D3'))).toEqual(530)
    expect(engine.getCellValue(adr('E3'))).toEqual(7.6)
  })
})
