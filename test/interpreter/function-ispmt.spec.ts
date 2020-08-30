import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function ISPMT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISPMT(1,1,1)', '=ISPMT(1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISPMT(1, 1, 10, 1)', '=ISPMT(1, 1, 0, 1)', '=ISPMT(1, -1, 1, 1)', '=ISPMT(-1, -1, 1, -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-0.9)
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C1'))).toEqual(-2)
    expect(engine.getCellValue(adr('D1'))).toEqual(-2)
  })
})
