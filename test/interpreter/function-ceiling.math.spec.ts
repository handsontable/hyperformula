import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CEILING.MATH', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.MATH()'],
      ['=CEILING.MATH(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.MATH("foo")'],
      ['=CEILING.MATH(1, "bar")'],
      ['=CEILING.MATH(1, 2, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.MATH(4.43, 0.3)'],
      ['=CEILING.MATH(4.43, 0.6)'],
      ['=CEILING.MATH(4.43, 2)'],
      ['=CEILING.MATH(4.43)'],
      ['=CEILING.MATH(-4.43)'],
      ['=CEILING.MATH(-3.14, -1.8)'],
      ['=CEILING.MATH(-3.14, 0)'],
      ['=CEILING.MATH(3.14, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(4.8)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
    expect(engine.getCellValue(adr('A5'))).toEqual(-4)
    expect(engine.getCellValue(adr('A6'))).toEqual(-1.8)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
    expect(engine.getCellValue(adr('A8'))).toEqual(0)
  })

  it('should work with mode for negative numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.MATH(-11, -2)'],
      ['=CEILING.MATH(-11, -2, 0)'],
      ['=CEILING.MATH(-11, -2, 1)'],
      ['=CEILING.MATH(-11, 0, 1)'],
      ['=CEILING.MATH(-11, 0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-10)
    expect(engine.getCellValue(adr('A2'))).toEqual(-10)
    expect(engine.getCellValue(adr('A3'))).toEqual(-12)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
  })

  it('negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING.MATH(11, 2, 0)'],
      ['=CEILING.MATH(-11, 2, 0)'],
      ['=CEILING.MATH(11, -2, 0)'],
      ['=CEILING.MATH(-11, -2, 0)'],
      ['=CEILING.MATH(11, 2, 1)'],
      ['=CEILING.MATH(-11, 2, 1)'],
      ['=CEILING.MATH(11, -2, 1)'],
      ['=CEILING.MATH(-11, -2, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(-10)
    expect(engine.getCellValue(adr('A3'))).toEqual(12)
    expect(engine.getCellValue(adr('A4'))).toEqual(-10)
    expect(engine.getCellValue(adr('A5'))).toEqual(12)
    expect(engine.getCellValue(adr('A6'))).toEqual(-12)
    expect(engine.getCellValue(adr('A7'))).toEqual(12)
    expect(engine.getCellValue(adr('A8'))).toEqual(-12)
  })
})
