import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.ADD', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.ADD(1)', '=HF.ADD(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.ADD(2,3)'],
      ['=HF.ADD(1.0000000000001,-1)'],
      ['=HF.ADD(1,)'],
      ['=HF.ADD(,)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(5)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('should coerce to correct types', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.ADD(TRUE(),B1)'],
      ['=HF.ADD("1",)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.ADD("abcd",)'],
      ['=HF.ADD(NA(),)'],
      ['=HF.ADD(B3:C3,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
