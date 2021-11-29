import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CONFIDENCE.T', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.T(1, 2)'],
      ['=CONFIDENCE.T(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.T("foo", 2, 3)'],
      ['=CONFIDENCE.T(0.5, "baz", 3)'],
      ['=CONFIDENCE.T(0.5, 2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.T(0.1, 1, 2)'],
      ['=CONFIDENCE.T(0.9, 10, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(4.46449651075278, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.59850759663214, 6)
  })

  it('should truncate third argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.T(0.1, 1, 2.9)'],
      ['=CONFIDENCE.T(0.9, 10, 5.9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(4.46449651075278, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.59850759663214, 6)
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CONFIDENCE.T(0.01, 0.01, 2)'],
      ['=CONFIDENCE.T(0, 0.01, 2)'],
      ['=CONFIDENCE.T(0.01, 0, 2)'],
      ['=CONFIDENCE.T(0.01, 0.1, 1.99)'],
      ['=CONFIDENCE.T(0.99, 0.01, 2)'],
      ['=CONFIDENCE.T(1, 0.01, 2)'],
      ['=CONFIDENCE.T(0.01, 0.1, 0.99)'],
      ['=CONFIDENCE.T(0.01, 0.1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.450121133444994, 6)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(0.000111081209667629, 6)
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
