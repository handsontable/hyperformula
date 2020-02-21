import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('function DEC2BIN', () => {
  it('should return error when wrong type of argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should return error when wrong number of argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN(1)'],
      ['=DEC2BIN(2)'],
      ['=DEC2BIN(98)'],
      ['=DEC2BIN(-12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('1100010')
    expect(engine.getCellValue(adr('A4'))).toEqual('1111110100')
  })

  it('should work for numeric strings', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN("123")'],
      ['=DEC2BIN("-15")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1111011')
    expect(engine.getCellValue(adr('A2'))).toEqual('1111110001')
  })

  it('should work for reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['12'],
      ['=DEC2BIN(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual('1100')
  })

  it('should return string value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN(123)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('should work for numbers between -512 and 511', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN(-513)'],
      ['=DEC2BIN(-512)'],
      ['=DEC2BIN(511)'],
      ['=DEC2BIN(512)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual('1000000000')
    expect(engine.getCellValue(adr('A3'))).toEqual('111111111')
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('should respect second argument and fill with zeros for positive arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN(2, 8)'],
      ['=DEC2BIN(5, "4")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('00000010')
    expect(engine.getCellValue(adr('A2'))).toEqual('0101')
  })

  it('should ignore second argument for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN(-2, 1)'],
      ['=DEC2BIN(-2, 10)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1111111110')
    expect(engine.getCellValue(adr('A2'))).toEqual('1111111110')
  })

  it('should allow for numbers from 1 to 10 as second argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DEC2BIN(2, 0)'],
      ['=DEC2BIN(-2, 12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=DEC2BIN(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
