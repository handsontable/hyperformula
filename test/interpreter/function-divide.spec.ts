import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function DIVIDE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DIVIDE(1)', '=DIVIDE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DIVIDE(6,3)'],
      ['=DIVIDE(,1)'],
      ['=DIVIDE(,)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should coerce to correct types', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DIVIDE(TRUE(),1)'],
      ['=DIVIDE(B2,1)'],
      ['=DIVIDE("1",1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DIVIDE("abcd",)'],
      ['=DIVIDE(NA(),)'],
      ['=DIVIDE(B3:C3,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
