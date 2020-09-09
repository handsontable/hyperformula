import {HyperFormula} from '../../src'
import {ErrorType, SimpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {ErrorMessage} from '../../src/error-message'
import {adr, dateNumberToString, detailedError} from '../testUtils'

const expectToHaveDate = (engine: HyperFormula, address: SimpleCellAddress, dateString: string) => {
  expect(dateNumberToString(engine.getCellValue(address), new Config())).toEqual(dateString)
}

describe('Function EDATE', () => {
  it('validate arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['=EDATE("foo", 0)'],
      ['=EDATE(A1, "bar")'],
      ['=EDATE(A1)'],
      ['=EDATE(A1, "bar", "baz")'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('works for 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 10)'],
      ['=EDATE(A1, 0)'],
    ])

    expectToHaveDate(engine, adr('A2'), '10/03/2019')
  })

  it('works for exact end of month', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['=EDATE(A1, 0)'],
    ])

    expectToHaveDate(engine, adr('A2'), '31/03/2019')
  })

  it('works for positive numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 7, 31)'],
      ['=EDATE(A1, 1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '31/08/2019')
  })

  it('works for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 8, 31)'],
      ['=EDATE(A1, -1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '31/07/2019')
  })

  it('works when next date will have more days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 6, 30)'],
      ['=EDATE(A1, 1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '30/07/2019')
  })

  it('works when next date will have less days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 1, 31)'],
      ['=EDATE(A1, 1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '28/02/2019')
  })

  it('works when previous date will have more days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 2, 28)'],
      ['=EDATE(A1, -1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '28/01/2019')
  })

  it('works when previous date will have less days', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['=EDATE(A1, -1)'],
    ])

    expectToHaveDate(engine, adr('A2'), '28/02/2019')
  })

  it('use number coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EDATE(TRUE(), 1)'],
      ['=EDATE(1, 1)'],
    ])

    expectToHaveDate(engine, adr('A1'), '31/01/1900')
    expectToHaveDate(engine, adr('A2'), '31/01/1900')
  })

  it('use number coercion for 2nd argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)'],
      ['="1"', '=EDATE(A1, A2)'],
      ['=TRUE()', '=EDATE(A1, A3)'],
    ])

    expectToHaveDate(engine, adr('B2'), '30/04/2019')
    expectToHaveDate(engine, adr('B3'), '30/04/2019')
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=EDATE(4/0, 0)'],
      ['=EDATE(0, 4/0)'],
      ['=EDATE(4/0, FOOBAR())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=EDATE(A1:A3, 1)'],
      ['=DATE(2018, 3, 31)', '=EDATE(A1:A3, 1)'],
      ['=DATE(2018, 3, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  // Inconsistency with Product 1
  it('range value in 2nd argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=EDATE(DATE(2019, 3, 31), A1:A3)'],
      ['2', '=EDATE(DATE(2019, 3, 31), A1:A3)'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
