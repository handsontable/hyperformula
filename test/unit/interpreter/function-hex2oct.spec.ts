import {HyperFormula} from '../../../src'
import {CellValueType, ErrorType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function HEX2OCT', () => {
  it('should return error when wrong number of argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for non-hex arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT("foo")'],
      ['=HEX2OCT("G418")'],
      ['=HEX2OCT(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT("1")'],
      ['=HEX2OCT("F")'],
      ['=HEX2OCT("2A")'],
      ['=HEX2OCT("26235")'],
      ['=HEX2OCT("1BB95B19")'],
      ['=HEX2OCT("CE6D570")'],
      ['=HEX2OCT("FFFB4B62A9")'],
      ['=HEX2OCT("FFFF439EB2")'],
      ['=HEX2OCT("FFFFFFFFFF")'],
      ['=HEX2OCT("1FFFFFFF")'],
      ['=HEX2OCT("FFE0000000")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('1')
    expect(engine.getCellValue(adr('A2'))).toBe('17')
    expect(engine.getCellValue(adr('A3'))).toBe('52')
    expect(engine.getCellValue(adr('A4'))).toBe('461065')
    expect(engine.getCellValue(adr('A5'))).toBe('3356255431')
    expect(engine.getCellValue(adr('A6'))).toBe('1471552560')
    expect(engine.getCellValue(adr('A7'))).toBe('7322661251')
    expect(engine.getCellValue(adr('A8'))).toBe('7720717262')
    expect(engine.getCellValue(adr('A9'))).toBe('7777777777')
    expect(engine.getCellValue(adr('A10'))).toBe('3777777777')
    expect(engine.getCellValue(adr('A11'))).toBe('4000000000')
  })

  it('should work for numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT(456)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('2126')
  })

  it('should work for reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['="123"'],
      ['=HEX2OCT(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toBe('443')
  })

  it('should return string value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT(11)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('result cannot be longer than 10 digits', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT("FFDFFFFFFF")'],
      ['=HEX2OCT("3FFFFFFF")'], ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLarge))
  })

  it('input cannot have more than 10 digits', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT("10000000000")'],

    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
  })

  it('should respect second argument and fill with zeros for positive arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT(12, 8)'],
      ['=HEX2OCT(3, "4")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('00000022')
    expect(engine.getCellValue(adr('A2'))).toBe('0003')
  })

  it('should fail if the result is longer than the desired length', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT(32123, 2)'],
      ['=HEX2OCT(433141, "3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLong))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLong))
  })

  it('second argument should not affect negative results', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT("FFFB4B62A9", 1)'],
      ['=HEX2OCT("FFFF439EB2", 10)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('7322661251')
    expect(engine.getCellValue(adr('A2'))).toBe('7720717262')
  })

  it('should allow for numbers from 1 to 10 as second argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HEX2OCT(2, 0)'],
      ['=HEX2OCT(2, 12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLong))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
