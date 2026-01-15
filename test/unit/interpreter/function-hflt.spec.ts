import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.LT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.LT(1)', '=HF.LT(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.LT(1, 0)'],
      ['=HF.LT(1, 1)'],
      ['=HF.LT("1", "0")'],
      ['=HF.LT("1", "1")'],
      ['=HF.LT(TRUE(), FALSE())'],
      ['=HF.LT(TRUE(), TRUE())'],
      ['=HF.LT(,)'],
      ['=HF.LT(1,)'],
      ['=HF.LT("1",)'],
      ['=HF.LT(TRUE(),)'],
      ['=HF.LT("1", 1)'],
      ['=HF.LT(TRUE(), 1)'],
      ['=HF.LT(TRUE(), "1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
    expect(engine.getCellValue(adr('A3'))).toBe(false)
    expect(engine.getCellValue(adr('A4'))).toBe(false)
    expect(engine.getCellValue(adr('A5'))).toBe(false)
    expect(engine.getCellValue(adr('A6'))).toBe(false)
    expect(engine.getCellValue(adr('A7'))).toBe(false)
    expect(engine.getCellValue(adr('A8'))).toBe(false)
    expect(engine.getCellValue(adr('A9'))).toBe(false)
    expect(engine.getCellValue(adr('A10'))).toBe(false)
    expect(engine.getCellValue(adr('A11'))).toBe(false)
    expect(engine.getCellValue(adr('A12'))).toBe(false)
    expect(engine.getCellValue(adr('A13'))).toBe(false)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.LT(NA(),)'],
      ['=HF.LT(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
