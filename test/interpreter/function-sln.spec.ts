import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function SLN', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SLN(1,1)', '=SLN(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SLN(1, 2, 1)', '=SLN(2, 1, -2)', '=SLN(3, 2, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.5)
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
