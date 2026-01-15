import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LEFT', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT()'],
      ['=LEFT("foo", 1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return VALUE when wrong type of second parameter', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work with empty argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT(, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('')
  })

  it('should return one character by default', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT("bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('b')
  })

  it('should return VALUE when second parameter is less than 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT("foo", -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NegativeLength))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT("", 4)'],
      ['=LEFT("bar", 0)'],
      ['=LEFT("bar", 1)'],
      ['=LEFT("bar", 3)'],
      ['=LEFT("bar", 4)'],
      ['=LEFT(123, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('')
    expect(engine.getCellValue(adr('A2'))).toBe('')
    expect(engine.getCellValue(adr('A3'))).toBe('b')
    expect(engine.getCellValue(adr('A4'))).toBe('bar')
    expect(engine.getCellValue(adr('A5'))).toBe('bar')
    expect(engine.getCellValue(adr('A6'))).toBe('12')
  })

  it('should coerce other types to string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LEFT(10, 1)'],
      ['=LEFT(5+5, 1)'],
      ['=LEFT(TRUE(), 1)'],
      ['=LEFT("010", 1)'],
      ['=LEFT(B5, 1)', "'010"],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('1')
    expect(engine.getCellValue(adr('A2'))).toBe('1')
    expect(engine.getCellValue(adr('A3'))).toBe('T')
    expect(engine.getCellValue(adr('A4'))).toBe('0')
    expect(engine.getCellValue(adr('A5'))).toBe('0')
  })
})
