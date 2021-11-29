import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CEILING.PRECISE', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.PRECISE()'],
      ['=CEILING.PRECISE(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.PRECISE(1, "bar")'],
      ['=CEILING.PRECISE("bar", 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.PRECISE(4.43, 0.3)'],
      ['=CEILING.PRECISE(4.43, 0.6)'],
      ['=CEILING.PRECISE(4.43, 2)'],
      ['=CEILING.PRECISE(-3.14, -1.8)'],
      ['=CEILING.PRECISE(-3.14, 0)'],
      ['=CEILING.PRECISE(3.14, 0)'],
      ['=CEILING.PRECISE(3.14)'],
      ['=CEILING.PRECISE(-3.14)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(4.8)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
    expect(engine.getCellValue(adr('A4'))).toEqual(-1.8)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toEqual(0)
    expect(engine.getCellValue(adr('A7'))).toEqual(4)
    expect(engine.getCellValue(adr('A8'))).toEqual(-3)
  })

  it('negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.PRECISE(11, 2)'],
      ['=CEILING.PRECISE(-11, 2)'],
      ['=CEILING.PRECISE(11, -2)'],
      ['=CEILING.PRECISE(-11, -2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(-10)
    expect(engine.getCellValue(adr('A3'))).toEqual(12)
    expect(engine.getCellValue(adr('A4'))).toEqual(-10)
  })
})
