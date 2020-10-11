import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function UNARY_PERCENT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UNARY_PERCENT()', '=UNARY_PERCENT(1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UNARY_PERCENT(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.02)
  })

  it('should coerce to correct types', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UNARY_PERCENT(TRUE())'],
      ['=UNARY_PERCENT(B2)'],
      ['=UNARY_PERCENT("1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.01)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(0.01)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UNARY_PERCENT("abcd")'],
      ['=UNARY_PERCENT(NA())'],
      ['=UNARY_PERCENT(B3:C3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})