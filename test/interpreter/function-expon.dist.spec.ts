import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function EXPON.DIST', () => {

  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=EXPON.DIST(1, 2)'],
      ['=EXPON.DIST(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=EXPON.DIST("foo", 2, TRUE())'],
      ['=EXPON.DIST(1, "baz", TRUE())'],
      ['=EXPON.DIST(1, 2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work as cdf', () => {
    const engine = HyperFormula.buildFromArray([
      ['=EXPON.DIST(1, 1, TRUE())'],
      ['=EXPON.DIST(10, 2, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.32105562956522493, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.9941790884215962, 6)
  })

  it('should work as pdf', () => {
    const engine = HyperFormula.buildFromArray([
      ['=EXPON.DIST(1, 1, FALSE())'],
      ['=EXPON.DIST(10, 2, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.32105562956522493, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.9941790884215962, 6)
  })
})
