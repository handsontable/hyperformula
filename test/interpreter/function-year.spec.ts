import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, dateNumberToString} from '../testUtils'

describe('Function YEAR', () => {
  it('function YEAR with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([['=YEAR(0)', '=YEAR(2)', '=YEAR(43465)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1899)
    expect(engine.getCellValue(adr('B1'))).toEqual(1900)
    expect(engine.getCellValue(adr('C1'))).toEqual(2018)
  })

  it('function YEAR with string arguments', () => {
    const engine = HyperFormula.buildFromArray([['=YEAR("12/31/1899")', '=YEAR("01/01/1900")', '=YEAR("12/31/2018")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1899)
    expect(engine.getCellValue(adr('B1'))).toEqual(1900)
    expect(engine.getCellValue(adr('C1'))).toEqual(2018)
  })

  it('function YEAR with wrong arguments', () => {
    const engine = HyperFormula.buildFromArray([['=YEAR("foo")', '=YEAR("30/12/2018")', '=YEAR(1, 2)', '=YEAR()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue(adr('D1'))).toEqual(new CellError(ErrorType.NA))
  })
})
