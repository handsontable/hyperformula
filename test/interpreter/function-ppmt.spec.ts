import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PPMT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PPMT(1,1)', '=PPMT(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PPMT(1%, 1, 360, 10000)', '=PPMT(1%, 1, 360, 10000, 3000)', '=PPMT(1%, 1, 360, 10000, 3000, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-2.86125969255043)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-3.71963760031556)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-102.692710495362)
  })
})
