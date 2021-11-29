import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function DEC2HEX', () => {
  it('should return error when wrong type of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return error when wrong number of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX(1)'],
      ['=DEC2HEX(50)'],
      ['=DEC2HEX(122)'],
      ['=DEC2HEX(-154)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('32')
    expect(engine.getCellValue(adr('A3'))).toEqual('7A')
    expect(engine.getCellValue(adr('A4'))).toEqual('FFFFFFFF66')
  })

  it('should work for numeric strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX("123")'],
      ['=DEC2HEX("-15")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('7B')
    expect(engine.getCellValue(adr('A2'))).toEqual('FFFFFFFFF1')
  })

  it('should work for reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['12'],
      ['=DEC2HEX(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual('C')
  })

  it('should return string value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX(123)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('should work for numbers fitting in 10 bits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX(-549755813889)'],
      ['=DEC2HEX(-549755813888)'],
      ['=DEC2HEX(549755813887)'],
      ['=DEC2HEX(549755813888)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseSmall))
    expect(engine.getCellValue(adr('A2'))).toEqual('8000000000')
    expect(engine.getCellValue(adr('A3'))).toEqual('7FFFFFFFFF')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLarge))
  })

  it('should respect second argument and fill with zeros for positive arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX(2, 8)'],
      ['=DEC2HEX(20, "4")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('00000002')
    expect(engine.getCellValue(adr('A2'))).toEqual('0014')
  })

  it('should ignore second argument for negative numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX(-2, 1)'],
      ['=DEC2HEX(-2, 10)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('FFFFFFFFFE')
    expect(engine.getCellValue(adr('A2'))).toEqual('FFFFFFFFFE')
  })

  it('should allow for numbers from 1 to 10 as second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2HEX(2, 0)'],
      ['=DEC2HEX(-2, 12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
