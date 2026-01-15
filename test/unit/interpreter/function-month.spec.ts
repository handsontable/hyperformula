import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MONTH', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MONTH("foo")', '=MONTH("12/30/2018")', '=MONTH(1, 2)', '=MONTH()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MONTH(0)', '=MONTH(2)', '=MONTH(43465)']])

    expect(engine.getCellValue(adr('A1'))).toBe(12)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('C1'))).toBe(12)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MONTH("31/12/1899")', '=MONTH("01/01/1900")', '=MONTH("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toBe(12)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('C1'))).toBe(12)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(TRUE())'],
      ['=MONTH(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(12)
    expect(engine.getCellValue(adr('A2'))).toBe(12)
  })

  it('propagate errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('test for days in month, start of month', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(DATE(2021,1,1))'],
      ['=MONTH(DATE(2021,2,1))'],
      ['=MONTH(DATE(2021,3,1))'],
      ['=MONTH(DATE(2021,4,1))'],
      ['=MONTH(DATE(2021,5,1))'],
      ['=MONTH(DATE(2021,6,1))'],
      ['=MONTH(DATE(2021,7,1))'],
      ['=MONTH(DATE(2021,8,1))'],
      ['=MONTH(DATE(2021,9,1))'],
      ['=MONTH(DATE(2021,10,1))'],
      ['=MONTH(DATE(2021,11,1))'],
      ['=MONTH(DATE(2021,12,1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(2)
    expect(engine.getCellValue(adr('A3'))).toBe(3)
    expect(engine.getCellValue(adr('A4'))).toBe(4)
    expect(engine.getCellValue(adr('A5'))).toBe(5)
    expect(engine.getCellValue(adr('A6'))).toBe(6)
    expect(engine.getCellValue(adr('A7'))).toBe(7)
    expect(engine.getCellValue(adr('A8'))).toBe(8)
    expect(engine.getCellValue(adr('A9'))).toBe(9)
    expect(engine.getCellValue(adr('A10'))).toBe(10)
    expect(engine.getCellValue(adr('A11'))).toBe(11)
    expect(engine.getCellValue(adr('A12'))).toBe(12)
  })

  it('test for days in month, end of month', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(DATE(2021,1,31))'],
      ['=MONTH(DATE(2021,2,28))'],
      ['=MONTH(DATE(2021,3,31))'],
      ['=MONTH(DATE(2021,4,30))'],
      ['=MONTH(DATE(2021,5,31))'],
      ['=MONTH(DATE(2021,6,30))'],
      ['=MONTH(DATE(2021,7,31))'],
      ['=MONTH(DATE(2021,8,31))'],
      ['=MONTH(DATE(2021,9,30))'],
      ['=MONTH(DATE(2021,10,31))'],
      ['=MONTH(DATE(2021,11,30))'],
      ['=MONTH(DATE(2021,12,31))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(2)
    expect(engine.getCellValue(adr('A3'))).toBe(3)
    expect(engine.getCellValue(adr('A4'))).toBe(4)
    expect(engine.getCellValue(adr('A5'))).toBe(5)
    expect(engine.getCellValue(adr('A6'))).toBe(6)
    expect(engine.getCellValue(adr('A7'))).toBe(7)
    expect(engine.getCellValue(adr('A8'))).toBe(8)
    expect(engine.getCellValue(adr('A9'))).toBe(9)
    expect(engine.getCellValue(adr('A10'))).toBe(10)
    expect(engine.getCellValue(adr('A11'))).toBe(11)
    expect(engine.getCellValue(adr('A12'))).toBe(12)
  })

  it('test for days in month, end of month+1', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(DATE(2021,1,31)+1)'],
      ['=MONTH(DATE(2021,2,28)+1)'],
      ['=MONTH(DATE(2021,3,31)+1)'],
      ['=MONTH(DATE(2021,4,30)+1)'],
      ['=MONTH(DATE(2021,5,31)+1)'],
      ['=MONTH(DATE(2021,6,30)+1)'],
      ['=MONTH(DATE(2021,7,31)+1)'],
      ['=MONTH(DATE(2021,8,31)+1)'],
      ['=MONTH(DATE(2021,9,30)+1)'],
      ['=MONTH(DATE(2021,10,31)+1)'],
      ['=MONTH(DATE(2021,11,30)+1)'],
      ['=MONTH(DATE(2021,12,31)+1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2)
    expect(engine.getCellValue(adr('A2'))).toBe(3)
    expect(engine.getCellValue(adr('A3'))).toBe(4)
    expect(engine.getCellValue(adr('A4'))).toBe(5)
    expect(engine.getCellValue(adr('A5'))).toBe(6)
    expect(engine.getCellValue(adr('A6'))).toBe(7)
    expect(engine.getCellValue(adr('A7'))).toBe(8)
    expect(engine.getCellValue(adr('A8'))).toBe(9)
    expect(engine.getCellValue(adr('A9'))).toBe(10)
    expect(engine.getCellValue(adr('A10'))).toBe(11)
    expect(engine.getCellValue(adr('A11'))).toBe(12)
    expect(engine.getCellValue(adr('A12'))).toBe(1)
  })

  it('test for days in month, start of month, leap year', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(DATE(2020,1,1))'],
      ['=MONTH(DATE(2020,2,1))'],
      ['=MONTH(DATE(2020,3,1))'],
      ['=MONTH(DATE(2020,4,1))'],
      ['=MONTH(DATE(2020,5,1))'],
      ['=MONTH(DATE(2020,6,1))'],
      ['=MONTH(DATE(2020,7,1))'],
      ['=MONTH(DATE(2020,8,1))'],
      ['=MONTH(DATE(2020,9,1))'],
      ['=MONTH(DATE(2020,10,1))'],
      ['=MONTH(DATE(2020,11,1))'],
      ['=MONTH(DATE(2020,12,1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(2)
    expect(engine.getCellValue(adr('A3'))).toBe(3)
    expect(engine.getCellValue(adr('A4'))).toBe(4)
    expect(engine.getCellValue(adr('A5'))).toBe(5)
    expect(engine.getCellValue(adr('A6'))).toBe(6)
    expect(engine.getCellValue(adr('A7'))).toBe(7)
    expect(engine.getCellValue(adr('A8'))).toBe(8)
    expect(engine.getCellValue(adr('A9'))).toBe(9)
    expect(engine.getCellValue(adr('A10'))).toBe(10)
    expect(engine.getCellValue(adr('A11'))).toBe(11)
    expect(engine.getCellValue(adr('A12'))).toBe(12)
  })

  it('test for days in month, end of month, leap year', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(DATE(2020,1,31))'],
      ['=MONTH(DATE(2020,2,29))'],
      ['=MONTH(DATE(2020,3,31))'],
      ['=MONTH(DATE(2020,4,30))'],
      ['=MONTH(DATE(2020,5,31))'],
      ['=MONTH(DATE(2020,6,30))'],
      ['=MONTH(DATE(2020,7,31))'],
      ['=MONTH(DATE(2020,8,31))'],
      ['=MONTH(DATE(2020,9,30))'],
      ['=MONTH(DATE(2020,10,31))'],
      ['=MONTH(DATE(2020,11,30))'],
      ['=MONTH(DATE(2020,12,31))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(2)
    expect(engine.getCellValue(adr('A3'))).toBe(3)
    expect(engine.getCellValue(adr('A4'))).toBe(4)
    expect(engine.getCellValue(adr('A5'))).toBe(5)
    expect(engine.getCellValue(adr('A6'))).toBe(6)
    expect(engine.getCellValue(adr('A7'))).toBe(7)
    expect(engine.getCellValue(adr('A8'))).toBe(8)
    expect(engine.getCellValue(adr('A9'))).toBe(9)
    expect(engine.getCellValue(adr('A10'))).toBe(10)
    expect(engine.getCellValue(adr('A11'))).toBe(11)
    expect(engine.getCellValue(adr('A12'))).toBe(12)
  })

  it('test for days in month, end of month+1, leap year', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MONTH(DATE(2020,1,31)+1)'],
      ['=MONTH(DATE(2020,2,29)+1)'],
      ['=MONTH(DATE(2020,3,31)+1)'],
      ['=MONTH(DATE(2020,4,30)+1)'],
      ['=MONTH(DATE(2020,5,31)+1)'],
      ['=MONTH(DATE(2020,6,30)+1)'],
      ['=MONTH(DATE(2020,7,31)+1)'],
      ['=MONTH(DATE(2020,8,31)+1)'],
      ['=MONTH(DATE(2020,9,30)+1)'],
      ['=MONTH(DATE(2020,10,31)+1)'],
      ['=MONTH(DATE(2020,11,30)+1)'],
      ['=MONTH(DATE(2020,12,31)+1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2)
    expect(engine.getCellValue(adr('A2'))).toBe(3)
    expect(engine.getCellValue(adr('A3'))).toBe(4)
    expect(engine.getCellValue(adr('A4'))).toBe(5)
    expect(engine.getCellValue(adr('A5'))).toBe(6)
    expect(engine.getCellValue(adr('A6'))).toBe(7)
    expect(engine.getCellValue(adr('A7'))).toBe(8)
    expect(engine.getCellValue(adr('A8'))).toBe(9)
    expect(engine.getCellValue(adr('A9'))).toBe(10)
    expect(engine.getCellValue(adr('A10'))).toBe(11)
    expect(engine.getCellValue(adr('A11'))).toBe(12)
    expect(engine.getCellValue(adr('A12'))).toBe(1)
  })
})
