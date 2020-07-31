import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function WEEKDAY', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=WEEKDAY(1, 2, 3)'],
      ['=WEEKDAY()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for wrong type of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=WEEKDAY("foo", 1)'],
      ['=WEEKDAY(2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should not work for wrong value of args', () => {
    const engine = HyperFormula.buildFromArray([
      ['=WEEKDAY(-1, 1)'],
      ['=WEEKDAY(2, 9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('should work for strings', () => {
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
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
})
