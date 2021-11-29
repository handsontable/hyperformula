import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SQRTPI', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SQRTPI()', '=SQRTPI(1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SQRTPI(0)'],
      ['=SQRTPI(1)'],
      ['=SQRTPI(PI())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.77245385090552, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(3.14159265358979, 6)
  })

  it('pass error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SQRTPI(NA())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
