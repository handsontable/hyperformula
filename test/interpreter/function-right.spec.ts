import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function RIGHT', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT()'],
      ['=RIGHT("foo", 1, 2)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return VALUE when wrong type of second parameter', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work with empty argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT(, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
  })

  it('should return one character by default', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT("bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('r')
  })

  it('should return VALUE when second parameter is less than 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT("foo", -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NegativeLength))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT("", 4)'],
      ['=RIGHT("bar", 0)'],
      ['=RIGHT("bar", 1)'],
      ['=RIGHT("bar", 3)'],
      ['=RIGHT("bar", 4)'],
      ['=RIGHT(123, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('')
    expect(engine.getCellValue(adr('A3'))).toEqual('r')
    expect(engine.getCellValue(adr('A4'))).toEqual('bar')
    expect(engine.getCellValue(adr('A5'))).toEqual('bar')
    expect(engine.getCellValue(adr('A6'))).toEqual('23')
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=RIGHT(1, 1)'],
      ['=RIGHT(5+5, 1)'],
      ['=RIGHT(TRUE(), 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('0')
    expect(engine.getCellValue(adr('A3'))).toEqual('E')
  })
})
