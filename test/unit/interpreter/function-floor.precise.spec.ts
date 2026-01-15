import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FLOOR.PRECISE', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.PRECISE()'],
      ['=FLOOR.PRECISE(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.PRECISE(1, "bar")'],
      ['=FLOOR.PRECISE("bar", 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.PRECISE(4.43, 0.3)'],
      ['=FLOOR.PRECISE(4.43, 0.6)'],
      ['=FLOOR.PRECISE(4.43, 2)'],
      ['=FLOOR.PRECISE(-3.14, -1.8)'],
      ['=FLOOR.PRECISE(-3.14, 0)'],
      ['=FLOOR.PRECISE(3.14, 0)'],
      ['=FLOOR.PRECISE(3.14)'],
      ['=FLOOR.PRECISE(-3.14)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(4.2)
    expect(engine.getCellValue(adr('A2'))).toBe(4.2)
    expect(engine.getCellValue(adr('A3'))).toBe(4)
    expect(engine.getCellValue(adr('A4'))).toBe(-3.6)
    expect(engine.getCellValue(adr('A5'))).toBe(0)
    expect(engine.getCellValue(adr('A6'))).toBe(0)
    expect(engine.getCellValue(adr('A7'))).toBe(3)
    expect(engine.getCellValue(adr('A8'))).toBe(-4)
  })

  it('negative values', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.PRECISE(11, 2)'],
      ['=FLOOR.PRECISE(-11, 2)'],
      ['=FLOOR.PRECISE(11, -2)'],
      ['=FLOOR.PRECISE(-11, -2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(10)
    expect(engine.getCellValue(adr('A2'))).toBe(-12)
    expect(engine.getCellValue(adr('A3'))).toBe(10)
    expect(engine.getCellValue(adr('A4'))).toBe(-12)
  })
})
