import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FLOOR.MATH', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.MATH()'],
      ['=FLOOR.MATH(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.MATH("foo")'],
      ['=FLOOR.MATH(1, "bar")'],
      ['=FLOOR.MATH(1, 2, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.MATH(4.43, 0.3)'],
      ['=FLOOR.MATH(4.43, 0.6)'],
      ['=FLOOR.MATH(4.43, 2)'],
      ['=FLOOR.MATH(4.43)'],
      ['=FLOOR.MATH(-4.43)'],
      ['=FLOOR.MATH(-3.14, -1.8)'],
      ['=FLOOR.MATH(-3.14, 0)'],
      ['=FLOOR.MATH(3.14, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(4.2)
    expect(engine.getCellValue(adr('A2'))).toBe(4.2)
    expect(engine.getCellValue(adr('A3'))).toBe(4)
    expect(engine.getCellValue(adr('A4'))).toBe(4)
    expect(engine.getCellValue(adr('A5'))).toBe(-5)
    expect(engine.getCellValue(adr('A6'))).toBe(-3.6)
    expect(engine.getCellValue(adr('A7'))).toBe(0)
    expect(engine.getCellValue(adr('A8'))).toBe(0)
  })

  it('should work with mode for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.MATH(-11, -2)'],
      ['=FLOOR.MATH(-11, -2, 0)'],
      ['=FLOOR.MATH(-11, -2, 1)'],
      ['=FLOOR.MATH(-11, 0, 1)'],
      ['=FLOOR.MATH(-11, 0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-12)
    expect(engine.getCellValue(adr('A2'))).toBe(-12)
    expect(engine.getCellValue(adr('A3'))).toBe(-10)
    expect(engine.getCellValue(adr('A4'))).toBe(0)
    expect(engine.getCellValue(adr('A5'))).toBe(0)
  })

  it('negative values', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FLOOR.MATH(11, 2, 0)'],
      ['=FLOOR.MATH(-11, 2, 0)'],
      ['=FLOOR.MATH(11, -2, 0)'],
      ['=FLOOR.MATH(-11, -2, 0)'],
      ['=FLOOR.MATH(11, 2, 1)'],
      ['=FLOOR.MATH(-11, 2, 1)'],
      ['=FLOOR.MATH(11, -2, 1)'],
      ['=FLOOR.MATH(-11, -2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(10)
    expect(engine.getCellValue(adr('A2'))).toBe(-12)
    expect(engine.getCellValue(adr('A3'))).toBe(10)
    expect(engine.getCellValue(adr('A4'))).toBe(-12)
    expect(engine.getCellValue(adr('A5'))).toBe(10)
    expect(engine.getCellValue(adr('A6'))).toBe(-10)
    expect(engine.getCellValue(adr('A7'))).toBe(10)
    expect(engine.getCellValue(adr('A8'))).toBe(-10)
  })
})
