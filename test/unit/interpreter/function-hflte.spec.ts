import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.LTE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.LTE(1)', '=HF.LTE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.LTE(1, 0)'],
      ['=HF.LTE(1, 1)'],
      ['=HF.LTE("1", "0")'],
      ['=HF.LTE("1", "1")'],
      ['=HF.LTE(TRUE(), FALSE())'],
      ['=HF.LTE(TRUE(), TRUE())'],
      ['=HF.LTE(,)'],
      ['=HF.LTE(1,)'],
      ['=HF.LTE("1",)'],
      ['=HF.LTE(TRUE(),)'],
      ['=HF.LTE("1", 1)'],
      ['=HF.LTE(TRUE(), 1)'],
      ['=HF.LTE(TRUE(), "1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(false)
    expect(engine.getCellValue(adr('A4'))).toBe(true)
    expect(engine.getCellValue(adr('A5'))).toBe(false)
    expect(engine.getCellValue(adr('A6'))).toBe(true)
    expect(engine.getCellValue(adr('A7'))).toBe(true)
    expect(engine.getCellValue(adr('A8'))).toBe(false)
    expect(engine.getCellValue(adr('A9'))).toBe(false)
    expect(engine.getCellValue(adr('A10'))).toBe(false)
    expect(engine.getCellValue(adr('A11'))).toBe(false)
    expect(engine.getCellValue(adr('A12'))).toBe(false)
    expect(engine.getCellValue(adr('A13'))).toBe(false)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=HF.LTE(NA(),)'],
      ['=HF.LTE(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
