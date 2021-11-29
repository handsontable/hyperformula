import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DAYS', () => {
  it('should not work for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAYS(1, 2, 3)'],
      ['=DAYS(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAYS("foo", 1)'],
      ['=DAYS(2, "bar")'],
      ['=DAYS(2, "12/30/2018")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work for strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAYS("30/12/2018", "30/12/2018")'],
      ['=DAYS("31/12/2018", "30/12/2018")'],
      ['=DAYS("30/12/2018", "31/12/2018")'],
      ['=DAYS("28/02/2017", "28/02/2016")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
    expect(engine.getCellValue(adr('A4'))).toEqual(366)
  })
  it('ignores time', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAYS("30/12/2018 1:00am", "30/12/2018 11:00pm")'],
      ['=DAYS("31/12/2018 1:00am", "30/12/2018 11:00pm")'],
      ['=DAYS("30/12/2018 11:00pm", "31/12/2018 1:00am")'],
      ['=DAYS("28/02/2017 11:00pm", "28/02/2016 1:00am")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
    expect(engine.getCellValue(adr('A4'))).toEqual(366)
  })

  it('should work for numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAYS(20, 10)'],
      ['=DAYS(12346, "28/02/2016")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(10)
    expect(engine.getCellValue(adr('A2'))).toEqual(-30082)
  })

  //inconsistency with product 1
  it('fails for negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DAYS(-1, 0)'],
      ['=DAYS(0, -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
