import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.UMINUS', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.UMINUS()', '=HF.UMINUS(1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.UMINUS(2)'],
      ['=HF.UMINUS(-3)'],
      ['=HF.UMINUS(0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-2)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('should coerce to correct types', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.UMINUS(TRUE())'],
      ['=HF.UMINUS(B2)'],
      ['=HF.UMINUS("1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(-1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(-1)
  })

  it('should throw correct error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.UMINUS("abcd")'],
      ['=HF.UMINUS(NA())'],
      ['=HF.UMINUS(B3:C3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
