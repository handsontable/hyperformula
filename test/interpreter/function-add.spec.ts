import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ADD', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADD(1)', '=ADD(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADD(,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual()
  })

  it('should coerce to correct types or throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADD(,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual()
  })
})
