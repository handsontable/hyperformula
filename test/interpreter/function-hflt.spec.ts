import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.LT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.LT(1)', '=HF.LT(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.LT(1,0)'],
      ['=HF.LT(1,1)'],
      ['=HF.LT("1","0")'],
      ['=HF.LT("1","1")'],
      ['=HF.LT(TRUE(),FALSE())'],
      ['=HF.LT(TRUE(),TRUE())'],
      ['=HF.LT(,)'],
      ['=HF.LT(1,)'],
      ['=HF.LT("1",)'],
      ['=HF.LT(TRUE(),)'],
      ['=HF.LT("1",1)'],
      ['=HF.LT(TRUE(),1)'],
      ['=HF.LT(TRUE(),"1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('A2'))).toEqual(false)
    expect(engine.getCellValue(adr('A3'))).toEqual(false)
    expect(engine.getCellValue(adr('A4'))).toEqual(false)
    expect(engine.getCellValue(adr('A5'))).toEqual(false)
    expect(engine.getCellValue(adr('A6'))).toEqual(false)
    expect(engine.getCellValue(adr('A7'))).toEqual(false)
    expect(engine.getCellValue(adr('A8'))).toEqual(false)
    expect(engine.getCellValue(adr('A9'))).toEqual(false)
    expect(engine.getCellValue(adr('A10'))).toEqual(false)
    expect(engine.getCellValue(adr('A11'))).toEqual(false)
    expect(engine.getCellValue(adr('A12'))).toEqual(false)
    expect(engine.getCellValue(adr('A13'))).toEqual(false)
  })

  it('should throw correct error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.LT(NA(),)'],
      ['=HF.LT(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
