import {HyperFormula} from '../../src'
import {CellValueDetailedType, ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TIMEVALUE', () => {
  it('with wrong arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=TIMEVALUE("foo")', '=TIMEVALUE(1)', '=TIMEVALUE(1, 2)', '=TIMEVALUE()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IncorrectDateTime))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.IncorrectDateTime))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('with string arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=TIMEVALUE("3:00pm")', '=TIMEVALUE("15:00")', '=TIMEVALUE("21:00:00")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.625)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_TIME)
    expect(engine.getCellValue(adr('B1'))).toEqual(0.625)
    expect(engine.getCellValue(adr('C1'))).toEqual(0.875)
  })

  it('ignores date', () => {
    const [engine] = HyperFormula.buildFromArray([['=TIMEVALUE("3:00pm")', '=TIMEVALUE("31/12/2018 3:00pm")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.625)
    expect(engine.getCellValue(adr('B1'))).toEqual(0.625)
  })

  it('rollover', () => {
    const [engine] = HyperFormula.buildFromArray([['=TIMEVALUE("24:00")', '=TIMEVALUE("31/12/2018 24:00")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TIMEVALUE(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
