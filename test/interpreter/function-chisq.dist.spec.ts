import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CHISQ.DIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST(1, 2)'],
      ['=CHISQ.DIST(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST("foo", 2, TRUE())'],
      ['=CHISQ.DIST(1, "baz", TRUE())'],
      ['=CHISQ.DIST(1, 2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST(1, 1, TRUE())'],
      ['=CHISQ.DIST(3, 2, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.682689492137056, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.77686983985157, 6)
  })

  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST(1, 1, FALSE())'],
      ['=CHISQ.DIST(3, 2, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.241970724519133, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.111565080074215, 6)
  })

  it('truncates second arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST(1, 1.9, FALSE())'],
      ['=CHISQ.DIST(3, 2.9, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.241970724519133, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.111565080074215, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CHISQ.DIST(10, 0.999, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
