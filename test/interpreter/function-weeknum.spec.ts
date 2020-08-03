import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function WEEKNUM', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=WEEKNUM(1, 2, 3)'],
      ['=WEEKNUM()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for wrong type of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=WEEKNUM("foo", 1)'],
      ['=WEEKNUM(2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should not work for wrong value of args', () => {
    const engine = HyperFormula.buildFromArray([
      ['=WEEKNUM(-1, 1)'],
      ['=WEEKNUM(2, 9)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('should work for strings', () => {
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
      ['=WEEKNUM(0)'],
      ['=WEEKNUM(0, 1)'],
      ['=WEEKNUM(0, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(52)
    expect(engine.getCellValue(adr('A2'))).toEqual(52)
    expect(engine.getCellValue(adr('A3'))).toEqual(53)
  })

  it('should work for strings with different nullDate', () => {
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
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
})
