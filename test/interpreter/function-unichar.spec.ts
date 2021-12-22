import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function UNICHAR', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=UNICHAR()'],
      ['=UNICHAR(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=UNICHAR("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=UNICHAR(1)'],
      ['=UNICHAR(33)'],
      ['=UNICHAR(65)'],
      ['=UNICHAR(90)'],
      ['=UNICHAR(209)'],
      ['=UNICHAR(255)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('!')
    expect(engine.getCellValue(adr('A3'))).toEqual('A')
    expect(engine.getCellValue(adr('A4'))).toEqual('Z')
    expect(engine.getCellValue(adr('A5'))).toEqual('Ñ')
    expect(engine.getCellValue(adr('A6'))).toEqual('ÿ')
  })

  it('should round down floats', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=UNICHAR(42)'],
      ['=UNICHAR(42.2)'],
      ['=UNICHAR(42.8)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('*')
    expect(engine.getCellValue(adr('A2'))).toEqual('*')
    expect(engine.getCellValue(adr('A3'))).toEqual('*')
  })

  it('should work only for values from 1 to 1114111 truncating decimal part', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=UNICHAR(0)'],
      ['=UNICHAR(0.5)'],
      ['=UNICHAR(1)'],
      ['=UNICHAR(256)'],
      ['=UNICHAR(1114111)'],
      ['=UNICHAR(1114111.5)'],
      ['=UNICHAR(1114112)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CharacterCodeBounds))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CharacterCodeBounds))
    expect(engine.getCellValue(adr('A3'))).toEqual('')
    expect(engine.getCellValue(adr('A4'))).toEqual('Ā')
    expect(engine.getCellValue(adr('A5'))).toEqual('􏿿')
    expect(engine.getCellValue(adr('A6'))).toEqual('􏿿')
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CharacterCodeBounds))
  })
})
