import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SLN', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SLN(1,1)', '=SLN(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SLN(1, 2, 1)', '=SLN(2, 1, -2)', '=SLN(3, 2, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-1)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.5)
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
