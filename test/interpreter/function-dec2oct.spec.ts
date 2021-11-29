import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function DEC2OCT', () => {
  it('should return error when wrong type of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return error when wrong number of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT(1)'],
      ['=DEC2OCT(10)'],
      ['=DEC2OCT(98)'],
      ['=DEC2OCT(-12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('12')
    expect(engine.getCellValue(adr('A3'))).toEqual('142')
    expect(engine.getCellValue(adr('A4'))).toEqual('7777777764')
  })

  it('should work for numeric strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT("123")'],
      ['=DEC2OCT("-15")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('173')
    expect(engine.getCellValue(adr('A2'))).toEqual('7777777761')
  })

  it('should work for reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['12'],
      ['=DEC2OCT(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual('14')
  })

  it('should return string value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT(123)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('should work for numbers fitting in 10 bits', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT(-536870913)'],
      ['=DEC2OCT(-536870912)'],
      ['=DEC2OCT(536870911)'],
      ['=DEC2OCT(536870912)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseSmall))
    expect(engine.getCellValue(adr('A2'))).toEqual('4000000000')
    expect(engine.getCellValue(adr('A3'))).toEqual('3777777777')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueBaseLarge))
  })

  it('should respect second argument and fill with zeros for positive arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT(2, 8)'],
      ['=DEC2OCT(5, "4")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('00000002')
    expect(engine.getCellValue(adr('A2'))).toEqual('0005')
  })

  it('should ignore second argument for negative numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT(-2, 1)'],
      ['=DEC2OCT(-2, 10)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('7777777776')
    expect(engine.getCellValue(adr('A2'))).toEqual('7777777776')
  })

  it('should allow for numbers from 1 to 10 as second argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEC2OCT(2, 0)'],
      ['=DEC2OCT(-2, 12)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
