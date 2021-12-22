import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MINUTE', () => {
  it('with wrong arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=MINUTE("foo")', '=MINUTE("12/30/2018")', '=MINUTE(1, 2)', '=MINUTE()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with numerical arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=MINUTE(0.5123456)', '=MINUTE(0)', '=MINUTE(0.999999)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(17)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('with string arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=MINUTE("14:42:59")', '=MINUTE("01/01/1900 03:01:02am")', '=MINUTE("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(0)
  })

  it('use datenumber coercion for 1st argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MINUTE(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MINUTE(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
