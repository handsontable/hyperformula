import {HyperFormula} from '../../src'
import {Config} from '../../src'
import {CellError, ErrorType, SimpleCellAddress} from '../../src/Cell'
import '../testConfig'
import {adr, dateNumberToString} from '../testUtils'

const expectToHaveDate = (engine: HyperFormula, address: SimpleCellAddress, dateString: string) => {
  expect(dateNumberToString(engine.getCellValue(address))).toEqual(dateString)
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

    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A4'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A5'))).toEqual(new CellError(ErrorType.NA))
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
})
