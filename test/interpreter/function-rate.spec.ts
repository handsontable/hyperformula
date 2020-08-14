import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function RATE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RATE(1,1)', '=RATE(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RATE(12, -100, 400)',],
      ['=RATE(12, -100, 400, 100, 1)',],
      ['=RATE(12, -100, 400, 1, 1)',],
      ['=RATE(12, -100, 400, 0, 1)',],
      ['=RATE(12, -100, 400, -100, 1)',],
      ['=RATE(12, -100, 400, 100, 1, -1)',],
      ['=RATE(0.9, -100, 400)',],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.228933070977096)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(-0.499692679085513)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(-0.99009900990099)
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A6'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(-0.8)
  })
})
