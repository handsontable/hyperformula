import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DAY', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=DAY("foo")', '=DAY("12/30/2018")', '=DAY(1, 2)', '=DAY()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=DAY(0)', '=DAY(2)', '=DAY(43465)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(30)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(31)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=DAY("31/12/1899")', '=DAY("01/01/1900")', '=DAY("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(31)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=DAY(TRUE())'],
      ['=DAY(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(31)
    expect(engine.getCellValue(adr('A2'))).toEqual(31)
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=DAY(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=DAY(A1:A3)'],
      ['=DATE(2019, 4, 31)', '=DAY(A1:A3)'],
      ['=DATE(2019, 5, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
