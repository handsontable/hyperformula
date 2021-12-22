import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function YEARFRAC', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC(1, 2, 3, 4)'],
      ['=YEARFRAC(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC("foo", 1, TRUE())'],
      ['=YEARFRAC(2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('US mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC("30/03/2020", "31/03/2020")'],
      ['=YEARFRAC("28/02/2020", "29/02/2020")'],
      ['=YEARFRAC("29/02/2020", "01/03/2020")'],
      ['=YEARFRAC("28/02/2021", "01/03/2021")'],
      ['=YEARFRAC("31/03/2020", "30/03/2020")'],
      ['=YEARFRAC("29/02/2020", "28/02/2020")'],
      ['=YEARFRAC("01/03/2020", "29/02/2020")'],
      ['=YEARFRAC("01/03/2021", "28/02/2021")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(1 / 360, 9)
  })

  it('actual/actual mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC("01/01/2020", "02/01/2020", 1)'],
      ['=YEARFRAC("01/01/2021", "02/01/2021", 1)'],
      ['=YEARFRAC("28/02/2020", "01/03/2020", 1)'],
      ['=YEARFRAC("28/02/2021", "01/03/2021", 1)'],
      ['=YEARFRAC("31/12/2019", "01/03/2020", 1)'],
      ['=YEARFRAC("31/12/2019", "29/02/2020", 1)'],
      ['=YEARFRAC("31/12/2019", "28/02/2020", 1)'],
      ['=YEARFRAC("01/01/2020", "01/01/2021", 1)'],
      ['=YEARFRAC("01/01/2020", "02/01/2021", 1)'],
      ['=YEARFRAC("01/01/2020", "01/01/2024", 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1 / 366, 9)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1 / 365, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2 / 366, 9)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(1 / 365, 9)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(61 / 366, 9)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(60 / 366, 9)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(59 / 365, 9)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(1, 9)
    expect(engine.getCellValue(adr('A9'))).toBeCloseTo(367 / 365.5, 9)
    expect(engine.getCellValue(adr('A10'))).toBeCloseTo((366 + 365 + 365 + 365) / ((366 + 365 + 365 + 365 + 366) / 5), 9)
  })

  it('actual/360 mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC("30/03/2020", "31/03/2020", 2)'],
      ['=YEARFRAC("28/02/2020", "29/02/2020", 2)'],
      ['=YEARFRAC("29/02/2020", "01/03/2020", 2)'],
      ['=YEARFRAC("28/02/2021", "01/03/2021", 2)'],
      ['=YEARFRAC("31/03/2020", "30/03/2021", 2)'],
      ['=YEARFRAC("01/03/2021", "28/02/2020", 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(364 / 360, 9)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(367 / 360, 9)
  })

  it('actual/365 mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC("30/03/2020", "31/03/2020", 3)'],
      ['=YEARFRAC("28/02/2020", "29/02/2020", 3)'],
      ['=YEARFRAC("29/02/2020", "01/03/2020", 3)'],
      ['=YEARFRAC("28/02/2021", "01/03/2021", 3)'],
      ['=YEARFRAC("31/03/2020", "30/03/2021", 3)'],
      ['=YEARFRAC("01/03/2021", "28/02/2020", 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1 / 365, 9)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1 / 365, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(1 / 365, 9)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(1 / 365, 9)
    expect(engine.getCellValue(adr('A5'))).toBeCloseTo(364 / 365, 9)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(367 / 365, 9)
  })

  it('EU mode', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=YEARFRAC("30/03/2020", "31/03/2020", 4)'],
      ['=YEARFRAC("28/02/2020", "29/02/2020", 4)'],
      ['=YEARFRAC("29/02/2020", "01/03/2020", 4)'],
      ['=YEARFRAC("28/02/2021", "01/03/2021", 4)'],
      ['=YEARFRAC("31/03/2020", "30/03/2020", 4)'],
      ['=YEARFRAC("29/02/2020", "28/02/2020", 4)'],
      ['=YEARFRAC("01/03/2020", "29/02/2020", 4)'],
      ['=YEARFRAC("01/03/2021", "28/02/2021", 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2 / 360, 9)
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(3 / 360, 9)
    expect(engine.getCellValue(adr('A5'))).toEqual(0)
    expect(engine.getCellValue(adr('A6'))).toBeCloseTo(1 / 360, 9)
    expect(engine.getCellValue(adr('A7'))).toBeCloseTo(2 / 360, 9)
    expect(engine.getCellValue(adr('A8'))).toBeCloseTo(3 / 360, 9)
  })
})
