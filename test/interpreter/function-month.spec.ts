import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function MONTH', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MONTH("foo")', '=MONTH("12/30/2018")', '=MONTH(1, 2)', '=MONTH()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MONTH(0)', '=MONTH(2)', '=MONTH(43465)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(12)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MONTH("31/12/1899")', '=MONTH("01/01/1900")', '=MONTH("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(12)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=MONTH(TRUE())'],
      ['=MONTH(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(12)
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=MONTH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=MONTH(A1:A3)'],
      ['=DATE(2019, 4, 31)', '=MONTH(A1:A3)'],
      ['=DATE(2019, 5, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
