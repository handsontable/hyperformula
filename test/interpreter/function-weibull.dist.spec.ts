import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function WEIBULL.DIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEIBULL.DIST(1, 2, 3)'],
      ['=WEIBULL.DIST(1, 2, 3, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEIBULL.DIST("foo", 2, 3, TRUE())'],
      ['=WEIBULL.DIST(1, "baz", 3, TRUE())'],
      ['=WEIBULL.DIST(1, 2, "baz", TRUE())'],
      ['=WEIBULL.DIST(1, 2, 3, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEIBULL.DIST(0.1, 1, 2, TRUE())'],
      ['=WEIBULL.DIST(0.5, 2, 4, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.048770575499286, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0155035629945915, 6)
  })

  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEIBULL.DIST(0.1, 1, 2, FALSE())'],
      ['=WEIBULL.DIST(0.5, 2, 4, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.475614712250357, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.061531027312838, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEIBULL.DIST(0, 1, 1, FALSE())'],
      ['=WEIBULL.DIST(-0.01, 0.01, 0.01, FALSE())'],
      ['=WEIBULL.DIST(0, 0, 0.01, FALSE())'],
      ['=WEIBULL.DIST(0, 0.01, 0, FALSE())'],
    ])

    //product #2 returns different value
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
