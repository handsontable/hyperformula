import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SECOND', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SECOND("foo")', '=SECOND("12/30/2018")', '=SECOND(1, 2)', '=SECOND()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SECOND(0.5123456)', '=SECOND(0)', '=SECOND(0.999999)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(47)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SECOND("14:42:59")', '=SECOND("01/01/1900 03:01:02am")', '=SECOND("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(59)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('use datenumber coercion for 1st argument', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SECOND(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SECOND(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('range value in 1st argument results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(2019, 3, 31)', '=SECOND(A1:A3)'],
      ['=DATE(2019, 4, 31)', '=SECOND(A1:A3)'],
      ['=DATE(2019, 5, 31)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
