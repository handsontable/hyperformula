import {CellError, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'

describe('Function DAYS', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS(1, 2, 3)'],
      ['=DAYS(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.NA))
  })

  it('should not work for wrong type of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS("foo", 1)'],
      ['=DAYS(2, "bar")'],
      ['=DAYS(2, "30/12/2018")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('should work for strings', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS("12/30/2018", "12/30/2018")'],
      ['=DAYS("12/31/2018", "12/30/2018")'],
      ['=DAYS("12/30/2018", "12/31/2018")'],
      ['=DAYS("02/28/2017", "02/28/2016")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
    expect(engine.getCellValue(adr('A4'))).toEqual(366)
  })

  it('should work for numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS(20, 10)'],
      ['=DAYS(12346, "02/28/2016")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(10)
    expect(engine.getCellValue(adr('A2'))).toEqual(-30082)
  })
})
