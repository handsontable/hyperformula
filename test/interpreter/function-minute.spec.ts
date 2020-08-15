import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function MINUTE', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MINUTE("foo")', '=MINUTE("12/30/2018")', '=MINUTE(1, 2)', '=MINUTE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MINUTE(0.5123456)', '=MINUTE(0)', '=MINUTE(0.999999)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(17)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=MINUTE("14:42:59")', '=MINUTE("01/01/1900 03:01:02am")', '=MINUTE("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=MINUTE(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=MINUTE(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=MINUTE(A1:A3)'],
      ['=DATE(2019, 4, 31)', '=MINUTE(A1:A3)'],
      ['=DATE(2019, 5, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
