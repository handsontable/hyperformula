import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DAY', () => {
  it('with wrong arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=DAY("foo")', '=DAY("12/30/2018")', '=DAY(1, 2)', '=DAY()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with numerical arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=DAY(0)', '=DAY(2)', '=DAY(43465)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(30)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(31)
  })

  it('with string arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=DAY("31/12/1899")', '=DAY("01/01/1900")', '=DAY("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(31)
  })

  it('use datenumber coercion for 1st argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(TRUE())'],
      ['=DAY(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(31)
  })

  it('propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('test for days in month, start of month', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(DATE(2021,1,1))'],
      ['=DAY(DATE(2021,2,1))'],
      ['=DAY(DATE(2021,3,1))'],
      ['=DAY(DATE(2021,4,1))'],
      ['=DAY(DATE(2021,5,1))'],
      ['=DAY(DATE(2021,6,1))'],
      ['=DAY(DATE(2021,7,1))'],
      ['=DAY(DATE(2021,8,1))'],
      ['=DAY(DATE(2021,9,1))'],
      ['=DAY(DATE(2021,10,1))'],
      ['=DAY(DATE(2021,11,1))'],
      ['=DAY(DATE(2021,12,1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
    expect(engine.getCellValue(adr('A8'))).toEqual(1)
    expect(engine.getCellValue(adr('A9'))).toEqual(1)
    expect(engine.getCellValue(adr('A10'))).toEqual(1)
    expect(engine.getCellValue(adr('A11'))).toEqual(1)
    expect(engine.getCellValue(adr('A12'))).toEqual(1)
  })

  it('test for days in month, end of month', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(DATE(2021,1,31))'],
      ['=DAY(DATE(2021,2,28))'],
      ['=DAY(DATE(2021,3,31))'],
      ['=DAY(DATE(2021,4,30))'],
      ['=DAY(DATE(2021,5,31))'],
      ['=DAY(DATE(2021,6,30))'],
      ['=DAY(DATE(2021,7,31))'],
      ['=DAY(DATE(2021,8,31))'],
      ['=DAY(DATE(2021,9,30))'],
      ['=DAY(DATE(2021,10,31))'],
      ['=DAY(DATE(2021,11,30))'],
      ['=DAY(DATE(2021,12,31))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(28)
    expect(engine.getCellValue(adr('A3'))).toEqual(31)
    expect(engine.getCellValue(adr('A4'))).toEqual(30)
    expect(engine.getCellValue(adr('A5'))).toEqual(31)
    expect(engine.getCellValue(adr('A6'))).toEqual(30)
    expect(engine.getCellValue(adr('A7'))).toEqual(31)
    expect(engine.getCellValue(adr('A8'))).toEqual(31)
    expect(engine.getCellValue(adr('A9'))).toEqual(30)
    expect(engine.getCellValue(adr('A10'))).toEqual(31)
    expect(engine.getCellValue(adr('A11'))).toEqual(30)
    expect(engine.getCellValue(adr('A12'))).toEqual(31)
  })

  it('test for days in month, end of month+1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(DATE(2021,1,31)+1)'],
      ['=DAY(DATE(2021,2,28)+1)'],
      ['=DAY(DATE(2021,3,31)+1)'],
      ['=DAY(DATE(2021,4,30)+1)'],
      ['=DAY(DATE(2021,5,31)+1)'],
      ['=DAY(DATE(2021,6,30)+1)'],
      ['=DAY(DATE(2021,7,31)+1)'],
      ['=DAY(DATE(2021,8,31)+1)'],
      ['=DAY(DATE(2021,9,30)+1)'],
      ['=DAY(DATE(2021,10,31)+1)'],
      ['=DAY(DATE(2021,11,30)+1)'],
      ['=DAY(DATE(2021,12,31)+1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
    expect(engine.getCellValue(adr('A8'))).toEqual(1)
    expect(engine.getCellValue(adr('A9'))).toEqual(1)
    expect(engine.getCellValue(adr('A10'))).toEqual(1)
    expect(engine.getCellValue(adr('A11'))).toEqual(1)
    expect(engine.getCellValue(adr('A12'))).toEqual(1)
  })

  it('test for days in month, start of month, leap year', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(DATE(2020,1,1))'],
      ['=DAY(DATE(2020,2,1))'],
      ['=DAY(DATE(2020,3,1))'],
      ['=DAY(DATE(2020,4,1))'],
      ['=DAY(DATE(2020,5,1))'],
      ['=DAY(DATE(2020,6,1))'],
      ['=DAY(DATE(2020,7,1))'],
      ['=DAY(DATE(2020,8,1))'],
      ['=DAY(DATE(2020,9,1))'],
      ['=DAY(DATE(2020,10,1))'],
      ['=DAY(DATE(2020,11,1))'],
      ['=DAY(DATE(2020,12,1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
    expect(engine.getCellValue(adr('A8'))).toEqual(1)
    expect(engine.getCellValue(adr('A9'))).toEqual(1)
    expect(engine.getCellValue(adr('A10'))).toEqual(1)
    expect(engine.getCellValue(adr('A11'))).toEqual(1)
    expect(engine.getCellValue(adr('A12'))).toEqual(1)
  })

  it('test for days in month, end of month, leap year', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(DATE(2020,1,31))'],
      ['=DAY(DATE(2020,2,29))'],
      ['=DAY(DATE(2020,3,31))'],
      ['=DAY(DATE(2020,4,30))'],
      ['=DAY(DATE(2020,5,31))'],
      ['=DAY(DATE(2020,6,30))'],
      ['=DAY(DATE(2020,7,31))'],
      ['=DAY(DATE(2020,8,31))'],
      ['=DAY(DATE(2020,9,30))'],
      ['=DAY(DATE(2020,10,31))'],
      ['=DAY(DATE(2020,11,30))'],
      ['=DAY(DATE(2020,12,31))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(29)
    expect(engine.getCellValue(adr('A3'))).toEqual(31)
    expect(engine.getCellValue(adr('A4'))).toEqual(30)
    expect(engine.getCellValue(adr('A5'))).toEqual(31)
    expect(engine.getCellValue(adr('A6'))).toEqual(30)
    expect(engine.getCellValue(adr('A7'))).toEqual(31)
    expect(engine.getCellValue(adr('A8'))).toEqual(31)
    expect(engine.getCellValue(adr('A9'))).toEqual(30)
    expect(engine.getCellValue(adr('A10'))).toEqual(31)
    expect(engine.getCellValue(adr('A11'))).toEqual(30)
    expect(engine.getCellValue(adr('A12'))).toEqual(31)
  })

  it('test for days in month, end of month+1, leap year', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAY(DATE(2020,1,31)+1)'],
      ['=DAY(DATE(2020,2,29)+1)'],
      ['=DAY(DATE(2020,3,31)+1)'],
      ['=DAY(DATE(2020,4,30)+1)'],
      ['=DAY(DATE(2020,5,31)+1)'],
      ['=DAY(DATE(2020,6,30)+1)'],
      ['=DAY(DATE(2020,7,31)+1)'],
      ['=DAY(DATE(2020,8,31)+1)'],
      ['=DAY(DATE(2020,9,30)+1)'],
      ['=DAY(DATE(2020,10,31)+1)'],
      ['=DAY(DATE(2020,11,30)+1)'],
      ['=DAY(DATE(2020,12,31)+1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(1)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
    expect(engine.getCellValue(adr('A6'))).toEqual(1)
    expect(engine.getCellValue(adr('A7'))).toEqual(1)
    expect(engine.getCellValue(adr('A8'))).toEqual(1)
    expect(engine.getCellValue(adr('A9'))).toEqual(1)
    expect(engine.getCellValue(adr('A10'))).toEqual(1)
    expect(engine.getCellValue(adr('A11'))).toEqual(1)
    expect(engine.getCellValue(adr('A12'))).toEqual(1)
  })
})
