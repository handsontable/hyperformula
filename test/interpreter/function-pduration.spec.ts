import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PDURATION', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PDURATION(1,1)', '=PDURATION(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PDURATION(2%, 12, 24)'],
      ['=PDURATION(2%, -12, -24)'],
      ['=PDURATION(0, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(35.00278878, 6)
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
