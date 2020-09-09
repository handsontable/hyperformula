import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CUMPRINC', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CUMPRINC(1,1,1,1,1)', '=CUMPRINC(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.ErrorArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CUMPRINC(1.1%, 12, 100, 1, 5, 0)', '=CUMPRINC(1.1%, 12, 100, 1, 5, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-40.07763042)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-40.72960477)
  })
})
