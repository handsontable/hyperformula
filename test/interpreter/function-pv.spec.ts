import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function PV', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PV(1,1)', '=PV(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PV(2%, 24, 100)', '=PV(2%, 24, 100, 400)', '=PV(2%, 24, 100, 400, 1)'],
      ['=PV(-99%, 24, 100)', '=PV(-1, 24, 100, 400)', '=PV(-2, 24, 100, 400, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-1891.39256, 6)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-2140.081155, 6)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-2177.909007, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-1.01010101010099e+50, 6)
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C2'))).toBeCloseTo(-400, 6)
  })
})
