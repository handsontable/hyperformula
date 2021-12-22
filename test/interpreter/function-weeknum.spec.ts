import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function WEEKNUM', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM(1, 2, 3)'],
      ['=WEEKNUM()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM("foo", 1)'],
      ['=WEEKNUM(2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should not work for wrong value of args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM(-1, 1)'],
      ['=WEEKNUM(2, 9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.BadMode))
  })

  it('should work for strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM("02/08/2020")'],
      ['=WEEKNUM("02/08/2020", "1")'],
      ['=WEEKNUM("02/08/2020", "2")'],
      ['=WEEKNUM("02/08/2020", "21")'],
      ['=WEEKNUM("02/08/2017", "2")'],
      ['=WEEKNUM("02/08/2017", "21")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(32)
    expect(engine.getCellValue(adr('A2'))).toEqual(32)
    expect(engine.getCellValue(adr('A3'))).toEqual(31)
    expect(engine.getCellValue(adr('A4'))).toEqual(31)
    expect(engine.getCellValue(adr('A5'))).toEqual(32)
    expect(engine.getCellValue(adr('A6'))).toEqual(31)
  })

  it('should work for numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM(0)'],
      ['=WEEKNUM(0, 1)'],
      ['=WEEKNUM(0, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(52)
    expect(engine.getCellValue(adr('A2'))).toEqual(52)
    expect(engine.getCellValue(adr('A3'))).toEqual(53)
  })

  it('should work for strings with different nullDate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM("02/08/2020")'],
      ['=WEEKNUM("02/08/2020", "1")'],
      ['=WEEKNUM("02/08/2020", "2")'],
      ['=WEEKNUM("02/08/2020", "21")'],
      ['=WEEKNUM("02/08/2017", "2")'],
      ['=WEEKNUM("02/08/2017", "21")'],
    ], {nullDate: {day: 20, month: 10, year: 1920}})

    expect(engine.getCellValue(adr('A1'))).toEqual(32)
    expect(engine.getCellValue(adr('A2'))).toEqual(32)
    expect(engine.getCellValue(adr('A3'))).toEqual(31)
    expect(engine.getCellValue(adr('A4'))).toEqual(31)
    expect(engine.getCellValue(adr('A5'))).toEqual(32)
    expect(engine.getCellValue(adr('A6'))).toEqual(31)
  })

  it('should work for strings with compatibility mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM("02/08/2020")'],
      ['=WEEKNUM("02/08/2020", "1")'],
      ['=WEEKNUM("02/08/2020", "2")'],
      ['=WEEKNUM("02/08/2020", "21")'],
      ['=WEEKNUM("02/08/2017", "2")'],
      ['=WEEKNUM("02/08/2017", "21")'],
    ], {leapYear1900: true})

    expect(engine.getCellValue(adr('A1'))).toEqual(32)
    expect(engine.getCellValue(adr('A2'))).toEqual(32)
    expect(engine.getCellValue(adr('A3'))).toEqual(31)
    expect(engine.getCellValue(adr('A4'))).toEqual(31)
    expect(engine.getCellValue(adr('A5'))).toEqual(32)
    expect(engine.getCellValue(adr('A6'))).toEqual(31)
  })
  it('should work for strings with compatibility mode and different nullDate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKNUM("02/08/2020")'],
      ['=WEEKNUM("02/08/2020", "1")'],
      ['=WEEKNUM("02/08/2020", "2")'],
      ['=WEEKNUM("02/08/2020", "21")'],
      ['=WEEKNUM("02/08/2017", "2")'],
      ['=WEEKNUM("02/08/2017", "21")'],
    ], {leapYear1900: true, nullDate: {day: 20, month: 10, year: 1920}})

    expect(engine.getCellValue(adr('A1'))).toEqual(32)
    expect(engine.getCellValue(adr('A2'))).toEqual(32)
    expect(engine.getCellValue(adr('A3'))).toEqual(31)
    expect(engine.getCellValue(adr('A4'))).toEqual(31)
    expect(engine.getCellValue(adr('A5'))).toEqual(32)
    expect(engine.getCellValue(adr('A6'))).toEqual(31)
  })

  it('big test', () => {
    const args = [1, 2, 11, 12, 13, 14, 15, 16, 17, 21]
    const dates = ['13/08/2020', '14/08/2020', '15/08/2020', '16/08/2020', '17/08/2020', '18/08/2020', '19/08/2020']
    const arrs = []
    for (const arg of args) {
      const arr = []
      for (const date of dates) {
        arr.push(`=WEEKNUM("${date}", ${arg})`)
      }
      arrs.push(arr)
    }
    const [engine] = HyperFormula.buildFromArray(arrs)
    expect(engine.getSheetValues(0)).toEqual(
      [[33, 33, 33, 34, 34, 34, 34],
        [33, 33, 33, 33, 34, 34, 34],
        [33, 33, 33, 33, 34, 34, 34],
        [33, 33, 33, 33, 33, 34, 34],
        [33, 33, 33, 33, 33, 33, 34],
        [34, 34, 34, 34, 34, 34, 34],
        [33, 34, 34, 34, 34, 34, 34],
        [33, 33, 34, 34, 34, 34, 34],
        [33, 33, 33, 34, 34, 34, 34],
        [33, 33, 33, 33, 34, 34, 34],
      ])
  })
})
