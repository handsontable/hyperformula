import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CONFIDENCE.NORM', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.NORM(1, 2)'],
      ['=CONFIDENCE.NORM(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.NORM("foo", 2, 3)'],
      ['=CONFIDENCE.NORM(0.5, "baz", 3)'],
      ['=CONFIDENCE.NORM(0.5, 2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.NORM(0.1, 1, 1)'],
      ['=CONFIDENCE.NORM(0.9, 10, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.64485362695147, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.561974627424251, 6)
  })

  it('should truncate third argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.NORM(0.1, 1, 1.9)'],
      ['=CONFIDENCE.NORM(0.9, 10, 5.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.64485362695147, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.561974627424251, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.NORM(0.01, 0.01, 1)'],
      ['=CONFIDENCE.NORM(0, 0.01, 1)'],
      ['=CONFIDENCE.NORM(0.01, 0, 1)'],
      ['=CONFIDENCE.NORM(0.01, 0.1, 0.99)'],
      ['=CONFIDENCE.NORM(0.99, 0.01, 1)'],
      ['=CONFIDENCE.NORM(1, 0.01, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.0257582930354889, 6)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(0.000125334695080692, 6)
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
