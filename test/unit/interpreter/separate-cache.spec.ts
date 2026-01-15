import {HyperFormula} from '../../../src'
import {adr} from '../testUtils'

describe('numeric aggreagtion functions', () => {
  it('should use separate caches', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2, 5, 10, 20],
      ['=MIN(A1:E1)', '=MAX(A1:E1)', '=SUM(A1:E1)', '=SUMSQ(A1:E1)', '=AVERAGE(A1:E1)'],
      ['=MIN(A1:E1)', '=MAX(A1:E1)', '=SUM(A1:E1)', '=SUMSQ(A1:E1)', '=AVERAGE(A1:E1)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toBe(1)
    expect(engine.getCellValue(adr('B3'))).toBe(20)
    expect(engine.getCellValue(adr('C3'))).toBe(38)
    expect(engine.getCellValue(adr('D3'))).toBe(530)
    expect(engine.getCellValue(adr('E3'))).toBe(7.6)
  })
})
