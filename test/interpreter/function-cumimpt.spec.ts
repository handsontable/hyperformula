import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessages} from '../../src/error-messages'
import {adr, detailedError} from '../testUtils'

describe('Function CUMIPMT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CUMIPMT(1,1,1,1,1)', '=CUMIPMT(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CUMIPMT(1.1%, 12, 100, 1, 5, 0)', '=CUMIPMT(1.1%, 12, 100, 1, 5, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-4.6279374617215)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-3.4895523854812)
  })
})
