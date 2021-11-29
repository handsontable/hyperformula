import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HOUR', () => {
  it('with wrong arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=HOUR("foo")', '=HOUR("12/30/2018")', '=HOUR(1, 2)', '=HOUR()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with numerical arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=HOUR(0.5123456)', '=HOUR(0)', '=HOUR(0.999999)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('with string arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=HOUR("14:42:59")', '=HOUR("01/01/1900 03:01:02am")', '=HOUR("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(14)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('use datenumber coercion for 1st argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HOUR(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HOUR(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
