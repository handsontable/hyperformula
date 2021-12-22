import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function BASE', () => {
  it('should return error when argument of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE("foo", 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should return error when wrong number of argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE("foo")'],
      ['=BASE("foo", 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE(1, 2, 3)'],
      ['=BASE(2, 5)'],
      ['=BASE(23, "10")'],
      ['=BASE(254, 15, "9")'],
      ['=BASE(634, 33)'],
      ['=BASE(789, 36)'],
      ['=BASE(1234123412341230, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('001')
    expect(engine.getCellValue(adr('A2'))).toEqual('2')
    expect(engine.getCellValue(adr('A3'))).toEqual('23')
    expect(engine.getCellValue(adr('A4'))).toEqual('00000011E')
    expect(engine.getCellValue(adr('A5'))).toEqual('J7')
    expect(engine.getCellValue(adr('A6'))).toEqual('LX')
    expect(engine.getCellValue(adr('A7'))).toEqual('100011000100110110110111111100110100000000111101110')
  })

  it('should work for numeric strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE("123", 4)'],
      ['=BASE("1234", 16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1323')
    expect(engine.getCellValue(adr('A2'))).toEqual('4D2')
  })

  it('should return string value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE(123, 2)'],
    ])

    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('should respect third argument and fill with zeros', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE(2, 8, 3)'],
      ['=BASE(94862, "33", 16)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('002')
    expect(engine.getCellValue(adr('A2'))).toEqual('0000000000002L3K')
  })

  it('should return result as is if padding shorter than result', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE(123, 2, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1111011')
  })

  it('should return error for negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE(-2, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('should allow base from 2 to 36', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BASE(2, 1)'],
      ['=BASE(2, 2)'],
      ['=BASE(2, 36)'],
      ['=BASE(2, 37)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('2')
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
