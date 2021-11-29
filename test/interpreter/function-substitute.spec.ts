import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SUBSTITUTE', () => {
  it('should take three or four parameters', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo", "f")'],
      ['=SUBSTITUTE("foobar", "o", "uu", 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should substitute new text for all occurrences of old text in a string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foo", "f", "bb")'],
      ['=SUBSTITUTE("foobar", "o", "uu")'],
      ['=SUBSTITUTE("fooobar", "oo", "x")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('bboo')
    expect(engine.getCellValue(adr('A2'))).toEqual('fuuuubar')
    expect(engine.getCellValue(adr('A3'))).toEqual('fxobar')
  })

  it('should substitute new text for nth occurrence of a string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "f", 1)'],
      ['=SUBSTITUTE("foobar", "o", "OO", 2)'],
      ['=SUBSTITUTE("foobar", "o", "OO", 3)'],
      ['=SUBSTITUTE("fofofofofo", "o", "u", 4)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('ffobar')
    expect(engine.getCellValue(adr('A2'))).toEqual('foOObar')
    expect(engine.getCellValue(adr('A3'))).toEqual('foobar')
    expect(engine.getCellValue(adr('A4'))).toEqual('fofofofufo')
  })

  it('should coerce', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", TRUE(), 1)'],
      ['=SUBSTITUTE("fooTRUE", TRUE(), 5, 1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('fTRUEobar')
    expect(engine.getCellValue(adr('A2'))).toEqual('foo5')
  })

  it('should return value when last argument is less than one', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "f", 0)'],
      ['=SUBSTITUTE("foobar", "o", "OO", -1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
  })

  it('should return value when arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUBSTITUTE("foobar", "o", "f", "bar")'],
      ['=SUBSTITUTE(B1:C1, "o", "f", 3)'],
      ['=SUBSTITUTE("foobar", B1:C1, "f", 3)'],
      ['=SUBSTITUTE("foobar", "o", B1:C1, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
