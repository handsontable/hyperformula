import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function FV', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FV(1,1)', '=FV(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FV(2%, 24, 100)', '=FV(2%, 24, 100, 400)', '=FV(2%, 24, 100, 400, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-3042.18624737613)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-3685.56114716622)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-3746.40487211374)
  })
})
