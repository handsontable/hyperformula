import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ISOWEEKNUM', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM(1, 2)'],
      ['=ISOWEEKNUM()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should not work for wrong value of args', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM(-1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('should work for strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM("02/08/2020")'],
      ['=ISOWEEKNUM("02/08/2017")'],
      ['=ISOWEEKNUM("01/01/2020")'],
      ['=ISOWEEKNUM("01/01/2017")'],
      ['=ISOWEEKNUM("01/01/2016")'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(31)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(52)
    expect(engine.getCellValue(adr('A5'))).toEqual(53)
  })

  it('should work for numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM(0)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(52)
  })

  it('should work for strings with different nullDate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM("02/08/2020")'],
      ['=ISOWEEKNUM("02/08/2017")'],
      ['=ISOWEEKNUM("01/01/2020")'],
      ['=ISOWEEKNUM("01/01/2017")'],
      ['=ISOWEEKNUM("01/01/2016")'],
    ], {nullDate: {day: 20, month: 10, year: 1920}})
    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(31)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(52)
    expect(engine.getCellValue(adr('A5'))).toEqual(53)
  })

  it('should work for strings with compatibility mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM("02/08/2020")'],
      ['=ISOWEEKNUM("02/08/2017")'],
      ['=ISOWEEKNUM("01/01/2020")'],
      ['=ISOWEEKNUM("01/01/2017")'],
      ['=ISOWEEKNUM("01/01/2016")'],
    ], {leapYear1900: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(31)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(52)
    expect(engine.getCellValue(adr('A5'))).toEqual(53)
  })
  it('should work for strings with compatibility mode and different nullDate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ISOWEEKNUM("02/08/2020")'],
      ['=ISOWEEKNUM("02/08/2017")'],
      ['=ISOWEEKNUM("01/01/2020")'],
      ['=ISOWEEKNUM("01/01/2017")'],
      ['=ISOWEEKNUM("01/01/2016")'],
    ], {leapYear1900: true, nullDate: {day: 20, month: 10, year: 1920}})
    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(31)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(52)
    expect(engine.getCellValue(adr('A5'))).toEqual(53)
  })
})
