import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DAYS360', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS360(1, 2, 3, 4)'],
      ['=DAYS360(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should not work for wrong type of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS360("foo", 1, TRUE())'],
      ['=DAYS360(2, "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('US mode', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS360("30/03/2020", "31/03/2020")'],
      ['=DAYS360("28/02/2020", "29/02/2020")'],
      ['=DAYS360("29/02/2020", "01/03/2020")'],
      ['=DAYS360("28/02/2021", "01/03/2021")'],
      ['=DAYS360("31/03/2020", "30/03/2020")'],
      ['=DAYS360("29/02/2020", "28/02/2020")'],
      ['=DAYS360("01/03/2020", "29/02/2020")'],
      ['=DAYS360("01/03/2021", "28/02/2021")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(1)
    expect(engine.getCellValue(adr('A4'))).toBe(1)
    expect(engine.getCellValue(adr('A5'))).toBe(0)
    expect(engine.getCellValue(adr('A6'))).toBe(-2)
    expect(engine.getCellValue(adr('A7'))).toBe(-2)
    expect(engine.getCellValue(adr('A8'))).toBe(-3)
  })

  it('EU mode', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DAYS360("30/03/2020", "31/03/2020", TRUE())'],
      ['=DAYS360("28/02/2020", "29/02/2020", TRUE())'],
      ['=DAYS360("29/02/2020", "01/03/2020", TRUE())'],
      ['=DAYS360("28/02/2021", "01/03/2021", TRUE())'],
      ['=DAYS360("31/03/2020", "30/03/2020", TRUE())'],
      ['=DAYS360("29/02/2020", "28/02/2020", TRUE())'],
      ['=DAYS360("01/03/2020", "29/02/2020", TRUE())'],
      ['=DAYS360("01/03/2021", "28/02/2021", TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('A2'))).toBe(1)
    expect(engine.getCellValue(adr('A3'))).toBe(2)
    expect(engine.getCellValue(adr('A4'))).toBe(3)
    expect(engine.getCellValue(adr('A5'))).toBe(0)
    expect(engine.getCellValue(adr('A6'))).toBe(-1)
    expect(engine.getCellValue(adr('A7'))).toBe(-2)
    expect(engine.getCellValue(adr('A8'))).toBe(-3)
  })
})
