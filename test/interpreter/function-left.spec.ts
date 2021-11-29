import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LEFT', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT()'],
      ['=LEFT("foo", 1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return VALUE when wrong type of second parameter', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work with empty argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT(, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
  })

  it('should return one character by default', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT("bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('b')
  })

  it('should return VALUE when second parameter is less than 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT("foo", -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NegativeLength))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT("", 4)'],
      ['=LEFT("bar", 0)'],
      ['=LEFT("bar", 1)'],
      ['=LEFT("bar", 3)'],
      ['=LEFT("bar", 4)'],
      ['=LEFT(123, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('')
    expect(engine.getCellValue(adr('A3'))).toEqual('b')
    expect(engine.getCellValue(adr('A4'))).toEqual('bar')
    expect(engine.getCellValue(adr('A5'))).toEqual('bar')
    expect(engine.getCellValue(adr('A6'))).toEqual('12')
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LEFT(1, 1)'],
      ['=LEFT(5+5, 1)'],
      ['=LEFT(TRUE(), 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('1')
    expect(engine.getCellValue(adr('A3'))).toEqual('T')
  })
})
