import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function WEEKDAY', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY(1, 2, 3)'],
      ['=WEEKDAY()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY("foo", 1)'],
      ['=WEEKDAY(2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should not work for wrong value of args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY(-1, 1)'],
      ['=WEEKDAY(2, 9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.BadMode))
  })

  it('should work for strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY("31/07/2020")'],
      ['=WEEKDAY("31/07/2020", "1")'],
      ['=WEEKDAY("31/07/2020", "2")'],
      ['=WEEKDAY("31/07/2020", "3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(6)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should work for numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY(0)'],
      ['=WEEKDAY(0, 1)'],
      ['=WEEKDAY(0, 2)'],
      ['=WEEKDAY(0, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(7)
    expect(engine.getCellValue(adr('A2'))).toEqual(7)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('should work for strings with different nullDate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY("31/07/2020")'],
      ['=WEEKDAY("31/07/2020", "1")'],
      ['=WEEKDAY("31/07/2020", "2")'],
      ['=WEEKDAY("31/07/2020", "3")'],
    ], {nullDate: {day: 20, month: 10, year: 1920}})

    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(6)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should work for strings with compatibility mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY("31/07/2020")'],
      ['=WEEKDAY("31/07/2020", "1")'],
      ['=WEEKDAY("31/07/2020", "2")'],
      ['=WEEKDAY("31/07/2020", "3")'],
    ], {leapYear1900: true})

    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(6)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should work for strings with compatibility mode and different nullDate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WEEKDAY("31/07/2020")'],
      ['=WEEKDAY("31/07/2020", "1")'],
      ['=WEEKDAY("31/07/2020", "2")'],
      ['=WEEKDAY("31/07/2020", "3")'],
    ], {leapYear1900: true, nullDate: {day: 20, month: 10, year: 1920}})

    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(6)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('big test', () => {
    const args = [1, 2, 3, 11, 12, 13, 14, 15, 16, 17]
    const dates = ['13/08/2020', '14/08/2020', '15/08/2020', '16/08/2020', '17/08/2020', '18/08/2020', '19/08/2020']
    const arrs = []
    for (const arg of args) {
      const arr = []
      for (const date of dates) {
        arr.push(`=WEEKDAY("${date}", ${arg})`)
      }
      arrs.push(arr)
    }
    const [engine] = HyperFormula.buildFromArray(arrs)
    expect(engine.getSheetValues(0)).toEqual(
      [[5, 6, 7, 1, 2, 3, 4],
        [4, 5, 6, 7, 1, 2, 3],
        [3, 4, 5, 6, 0, 1, 2],
        [4, 5, 6, 7, 1, 2, 3],
        [3, 4, 5, 6, 7, 1, 2],
        [2, 3, 4, 5, 6, 7, 1],
        [1, 2, 3, 4, 5, 6, 7],
        [7, 1, 2, 3, 4, 5, 6],
        [6, 7, 1, 2, 3, 4, 5],
        [5, 6, 7, 1, 2, 3, 4]])
  })
})
