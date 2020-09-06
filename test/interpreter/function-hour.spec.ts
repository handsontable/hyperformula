import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function HOUR', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=HOUR("foo")', '=HOUR("12/30/2018")', '=HOUR(1, 2)', '=HOUR()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, 'Value cannot be coerced to number.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE, 'Value cannot be coerced to number.'))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=HOUR(0.5123456)', '=HOUR(0)', '=HOUR(0.999999)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=HOUR("14:42:59")', '=HOUR("01/01/1900 03:01:02am")', '=HOUR("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(14)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=HOUR(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=HOUR(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=HOUR(A1:A3)'],
      ['=DATE(2019, 4, 31)', '=HOUR(A1:A3)'],
      ['=DATE(2019, 5, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
