import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function BINOM.DIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.DIST(1, 2, 3)'],
      ['=BINOM.DIST(1, 2, 3, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.DIST("foo", 2, 3, TRUE())'],
      ['=BINOM.DIST(1, "baz", 3, TRUE())'],
      ['=BINOM.DIST(1, 2, "baz", TRUE())'],
      ['=BINOM.DIST(1, 1, 1, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.DIST(1, 1, 0.1, TRUE())'],
      ['=BINOM.DIST(10, 20, 0.7, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)

    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0479618973, 6)
  })

  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.DIST(1, 1, 0.1, FALSE())'],
      ['=BINOM.DIST(10, 20, 0.7, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.1)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0308170809000851, 6)
  })

  it('truncation works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.DIST(1.9, 1.99, 0.1, FALSE())'],
      ['=BINOM.DIST(10.5, 20.2, 0.7, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.1)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0308170809000851, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.DIST(-0.00001, 1, 1, FALSE())'],
      ['=BINOM.DIST(0.5, -0.01, 1, FALSE())'],
      ['=BINOM.DIST(0.5, 0.4, 1, FALSE())'],
      ['=BINOM.DIST(1, 1, -0.01, FALSE())'],
      ['=BINOM.DIST(1, 1, 1.01, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //product #2 returns 1 for following test
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WrongOrder))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
