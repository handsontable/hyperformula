import {HyperFormula} from '../../src'
import {ErrorType, SimpleCellAddress} from '../../src/Cell'
import '../testConfig'
import {Config} from '../../src/Config'
import {adr, dateNumberToString, detailedError} from '../testUtils'

const expectToHaveDate = (engine: HyperFormula, address: SimpleCellAddress, dateString: string) => {
  expect(dateNumberToString(engine.getCellValue(address), new Config())).toEqual(dateString)
}

describe('Function EOMONTH', () => {
  it('validate arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['=EOMONTH("foo", 0)'],
      ['=EOMONTH(A1, "bar")'],
      ['=EOMONTH(A1)'],
      ['=EOMONTH(A1, "bar", "baz")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works for 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 10)'],
      ['=EOMONTH(A1, 0)'],
    ])

    expectToHaveDate(engine, adr('A2'), '03/31/2019')
  })

  it('works for exact end of month', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['=EOMONTH(A1, 0)'],
    ])

    expectToHaveDate(engine, adr('A2'), '03/31/2019')
  })

  it('works for positive numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 7, 31)'],
      ['=EOMONTH(A1, 1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '08/31/2019')
  })

  it('works for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 8, 31)'],
      ['=EOMONTH(A1, -1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '07/31/2019')
  })

  it('works when next date will have more days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 6, 30)'],
      ['=EOMONTH(A1, 1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '07/31/2019')
  })

  it('works when next date will have less days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 1, 31)'],
      ['=EOMONTH(A1, 1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '02/28/2019')
  })

  it('works when previous date will have more days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 2, 28)'],
      ['=EOMONTH(A1, -1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '01/31/2019')
  })

  it('works when previous date will have less days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['=EOMONTH(A1, -1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '02/28/2019')
  })

  it('use number coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EOMONTH(TRUE(), 1)'],
      ['=EOMONTH(1, 1)'],
    ])

    expectToHaveDate(engine, adr('A1'), '01/31/1900')
    expectToHaveDate(engine, adr('A2'), '01/31/1900')
  })

  it('use number coercion for 2nd argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['="1"', '=EOMONTH(A1, A2)'],
      ['=TRUE()', '=EOMONTH(A1, A3)'],
    ])

    expectToHaveDate(engine, adr('B2'), '04/30/2019')
    expectToHaveDate(engine, adr('B3'), '04/30/2019')
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EOMONTH(4/0, 0)'],
      ['=EOMONTH(0, 4/0)'],
      ['=EOMONTH(4/0, FOOBAR())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=EOMONTH(A1:A3, 1)'],
      ['=DATE(2018, 3, 31)', '=EOMONTH(A1:A3, 1)'],
      ['=DATE(2018, 3, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  // Inconsistency with Product 1
  it('range value in 2nd argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=EOMONTH(DATE(2019, 3, 31), A1:A3)'],
      ['2', '=EOMONTH(DATE(2019, 3, 31), A1:A3)'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
