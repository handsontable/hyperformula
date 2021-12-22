import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function HEX2DEC', () => {
  it('should return error when wrong number of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HEX2DEC("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for non-hex arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HEX2DEC("foo")'],
      ['=HEX2DEC("23G")'],
      ['=HEX2DEC(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HEX2DEC("1")'],
      ['=HEX2DEC("10")'],
      ['=HEX2DEC("AD")'],
      ['=HEX2DEC("ABBA")'],
      ['=HEX2DEC("BA0AB")'],
      ['=HEX2DEC("B09D65")'],
      ['=HEX2DEC("F1808E4")'],
      ['=HEX2DEC("B07D007")'],
      ['=HEX2DEC("7FFFFFFFFF")'],
      ['=HEX2DEC("F352DEB731")'],
      ['=HEX2DEC("FFFFFFFFFF")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(16)
    expect(engine.getCellValue(adr('A3'))).toEqual(173)
    expect(engine.getCellValue(adr('A4'))).toEqual(43962)
    expect(engine.getCellValue(adr('A5'))).toEqual(762027)
    expect(engine.getCellValue(adr('A6'))).toEqual(11574629)
    expect(engine.getCellValue(adr('A7'))).toEqual(253233380)
    expect(engine.getCellValue(adr('A8'))).toEqual(185061383)
    expect(engine.getCellValue(adr('A9'))).toEqual(549755813887)
    expect(engine.getCellValue(adr('A10'))).toEqual(-54444247247)
    expect(engine.getCellValue(adr('A11'))).toEqual(-1)
  })

  it('should work for numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HEX2DEC(456)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1110)
  })

  it('should work for reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="1A3"'],
      ['=HEX2DEC(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(419)
  })

  it('should return a number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HEX2DEC("11")'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.NUMBER)
  })

  it('should work only for 10 digits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HEX2DEC("1010B040205")'],
      ['=HEX2DEC("7777EE70D2")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotHex))
    expect(engine.getCellValue(adr('A2'))).toEqual(513113223378)
  })
})
