import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function UMINUS', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UMINUS()', '=UMINUS(1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UMINUS(2)'],
      ['=UMINUS(-3)'],
      ['=UMINUS(0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-2)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('should coerce to correct types', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UMINUS(TRUE())'],
      ['=UMINUS(B2)'],
      ['=UMINUS("1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UMINUS("abcd")'],
      ['=UMINUS(NA())'],
      ['=UMINUS(B3:C3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
