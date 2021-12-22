import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function INTERVAL', () => {
  it('with wrong arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=INTERVAL("foo")', '=INTERVAL("12/30/2018")', '=INTERVAL(1, 2)', '=INTERVAL()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with numerical arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=INTERVAL(0)', '=INTERVAL(10000000)', '=INTERVAL(365.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual('PT')
    expect(engine.getCellValue(adr('B1'))).toEqual('P3M25DT17H46M40S')
    expect(engine.getCellValue(adr('C1'))).toEqual('PT6M5S')
  })

  it('with string arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=INTERVAL("31/12/1899")', '=INTERVAL("01/01/1900")', '=INTERVAL("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('PT1S')
    expect(engine.getCellValue(adr('B1'))).toEqual('PT2S')
    expect(engine.getCellValue(adr('C1'))).toEqual('PT12H4M25S')
  })

  it('use datenumber coercion for 1st argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INTERVAL(TRUE())'],
      ['=INTERVAL("1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('PT1S')
    expect(engine.getCellValue(adr('A2'))).toEqual('PT1S')
  })

  it('propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=INTERVAL(NA())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
