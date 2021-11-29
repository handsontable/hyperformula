import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.DIVIDE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.DIVIDE(1)', '=HF.DIVIDE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.DIVIDE(6,4)'],
      ['=HF.DIVIDE(,1)'],
      ['=HF.DIVIDE(1,)'],
      ['=HF.DIVIDE(,)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should coerce to correct types', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.DIVIDE(TRUE(),1)'],
      ['=HF.DIVIDE(B2,1)'],
      ['=HF.DIVIDE("1",1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('should throw correct error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.DIVIDE("abcd",)'],
      ['=HF.DIVIDE(NA(),)'],
      ['=HF.DIVIDE(B3:C3,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('passes subtypes', () => {
    const [engine] = HyperFormula.buildFromArray([['=HF.DIVIDE(B1,C1)', '1$', 1]])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
  })
})
