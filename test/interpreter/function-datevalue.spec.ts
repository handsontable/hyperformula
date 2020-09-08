import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessages} from '../../src/error-messages'
import {adr, detailedError} from '../testUtils'

describe('Function DATEVALUE', () => {
  it('with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=DATEVALUE("foo")', '=DATEVALUE(1)', '=DATEVALUE(1, 2)', '=DATEVALUE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessages.IncorrectDateTime))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessages.IncorrectDateTime))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
  })

  it('with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=DATEVALUE("31/12/1899")', '=DATEVALUE("01/01/1900")', '=DATEVALUE("31/12/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('C1'))).toEqual(43465)
  })

  it('ignores time', () => {
    const engine = HyperFormula.buildFromArray([['=DATEVALUE("2:00pm")', '=DATEVALUE("31/12/2018 2:00pm")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toEqual(43465)
  })

  it('border case', () => {
    const engine = HyperFormula.buildFromArray([['=DATEVALUE("25:00")', '=DATEVALUE("31/12/2018 25:00")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toEqual(43466)
  })



  it('propagate errors', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=DATEVALUE(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
