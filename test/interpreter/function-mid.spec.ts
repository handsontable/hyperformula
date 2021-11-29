import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MID', () => {
  it('should take three arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID()'],
      ['=MID("foo", "bar")'],
      ['=MID("foo", "bar", "baz", "qux")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return substring', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID("foo", 1, 2)'],
      ['=MID("bar", 2, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('fo')
    expect(engine.getCellValue(adr('A2'))).toEqual('ar')
  })

  it('should return empty string if start is greater than text length', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID("", 2, 1)'],
      ['=MID("foo", 5, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('')
  })

  it('should return chars up to string length if end start + number of chars exceeds string length', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID("foo", 2, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('oo')
  })

  it('should return #VALUE! if start num is less than 1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID("foo", 0, 1)'],
      ['=MID("foo", -1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('should return #VALUE! if number of chars is negative', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID("foo", 1, -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NegativeLength))
  })

  it('should coerce', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID(TRUE(), 2, 2)'],
      ['=MID(0, 1, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('RU')
    expect(engine.getCellValue(adr('A2'))).toEqual('0')
  })

  it('should return error for range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MID(B2:B3, 1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
