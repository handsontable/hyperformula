import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NEGBINOM.DIST', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NEGBINOM.DIST(1, 2, 3)'],
      ['=NEGBINOM.DIST(1, 2, 3, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NEGBINOM.DIST("foo", 2, 1, TRUE())'],
      ['=NEGBINOM.DIST(1, "baz", 1, TRUE())'],
      ['=NEGBINOM.DIST(1, 2, "baz", TRUE())'],
      ['=NEGBINOM.DIST(1, 2, 1, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('should work as cdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NEGBINOM.DIST(10, 20, 0.5, TRUE())'],
      ['=NEGBINOM.DIST(2, 3, 0.1, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0493685733526945, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.00856, 6)
  })

  it('should work as pdf', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NEGBINOM.DIST(10, 20, 0.5, FALSE())'],
      ['=NEGBINOM.DIST(2, 3, 0.1, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0186544004827738, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.00486, 6)
  })

  it('truncates first and second arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NEGBINOM.DIST(10.9, 20, 0.5, FALSE())'],
      ['=NEGBINOM.DIST(2, 3.9, 0.1, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0186544004827738, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.00486, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NEGBINOM.DIST(0, 1, 0.5, FALSE())'],
      ['=NEGBINOM.DIST(-0.001, 1, 0.5, FALSE())'],
      ['=NEGBINOM.DIST(0, 0.999, 0.5, FALSE())'],
      ['=NEGBINOM.DIST(0, 1, 0, FALSE())'],
      ['=NEGBINOM.DIST(0, 1, -0.01, FALSE())'],
      ['=NEGBINOM.DIST(0, 1, 1, FALSE())'],
      ['=NEGBINOM.DIST(0, 1, 1.01, FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //product #2 returns error
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //product #2 returns error
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
