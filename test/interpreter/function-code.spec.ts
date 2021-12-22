import {CellValueType, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CODE', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CODE()'],
      ['=CODE("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for empty strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CODE("")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.EmptyString))
  })

  it('should work for single chars', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CODE("")'],
      ['=CODE("!")'],
      ['=CODE("A")'],
      ['=CODE("Z")'],
      ['=CODE("Ñ")'],
      ['=CODE("ÿ")'],
      ['=CODE(TRUE())'],
      ['=CODE("€")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(33)
    expect(engine.getCellValue(adr('A3'))).toEqual(65)
    expect(engine.getCellValue(adr('A4'))).toEqual(90)
    expect(engine.getCellValue(adr('A5'))).toEqual(209)
    expect(engine.getCellValue(adr('A6'))).toEqual(255)
    expect(engine.getCellValue(adr('A7'))).toEqual(84)
    expect(engine.getCellValue(adr('A8'))).toEqual(8364)
  })

  it('should return code of first character', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CODE("Abar")'],
      ['=CODE("Ñbaz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(65)
    expect(engine.getCellValue(adr('A2'))).toEqual(209)
  })

  it('should return number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CODE("foo")']
    ])

    expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
  })

  it('should be identity when composed with CHAR', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CODE(CHAR(1))'],
      ['=CODE(CHAR(128))'],
      ['=CODE(CHAR(255))']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(128)
    expect(engine.getCellValue(adr('A3'))).toEqual(255)
  })
})
