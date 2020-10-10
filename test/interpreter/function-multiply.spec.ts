import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function MULTIPLY', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MULTIPLY(1)', '=MULTIPLY(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MULTIPLY(2,3)'],
      ['=MULTIPLY(1,)'],
      ['=MULTIPLY(,)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(6)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('should coerce to correct types', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MULTIPLY(TRUE(),1)'],
      ['=MULTIPLY(B2,1)'],
      ['=MULTIPLY("1",1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MULTIPLY("abcd",)'],
      ['=MULTIPLY(NA(),)'],
      ['=MULTIPLY(B3:C3,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
