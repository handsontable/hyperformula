import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function OCT2BIN', () => {
  it('should return error when wrong number of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for non-oct arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN("foo")'],
      ['=OCT2BIN(418)'],
      ['=OCT2BIN(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(1)'],
      ['=OCT2BIN(10)'],
      ['=OCT2BIN(71)'],
      ['=OCT2BIN(777)'],
      ['=OCT2BIN(7777777000)'],
      ['=OCT2BIN(7777777042)'],
      ['=OCT2BIN(7777777777)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('1000')
    expect(engine.getCellValue(adr('A3'))).toEqual('111001')
    expect(engine.getCellValue(adr('A4'))).toEqual('111111111')
    expect(engine.getCellValue(adr('A5'))).toEqual('1000000000')
    expect(engine.getCellValue(adr('A6'))).toEqual('1000100010')
    expect(engine.getCellValue(adr('A7'))).toEqual('1111111111')
  })

  it('should work for strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN("456")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('100101110')
  })

  it('should work for reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="123"'],
      ['=OCT2BIN(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual('1010011')
  })

  it('should return string value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(11)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('should work only for 10 digits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(10101010101010)'],
      ['=OCT2BIN(7777777042)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NotOctal))
    expect(engine.getCellValue(adr('A2'))).toEqual('1000100010')
  })

  it('result cannot be longer than 10 digits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(1000)'],
      ['=OCT2BIN(7777776777)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLarge))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseSmall))
  })

  it('should respect second argument and fill with zeros for positive arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(12, 8)'],
      ['=OCT2BIN(3, "4")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('00001010')
    expect(engine.getCellValue(adr('A2'))).toEqual('0011')
  })

  it('second argument should not affect negative results', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(7777777042, 1)'],
      ['=OCT2BIN(7777777042, 10)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1000100010')
    expect(engine.getCellValue(adr('A2'))).toEqual('1000100010')
  })

  it('should fail if the result is longer than the desired length', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(12123, 2)'],
      ['=OCT2BIN(34141, "3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLarge))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLarge))
  })

  it('should allow for numbers from 1 to 10 as second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=OCT2BIN(2, 0)'],
      ['=OCT2BIN(2, 12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLong))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
