import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.GT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.GT(1)', '=HF.GT(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.GT(1,0)'],
      ['=HF.GT(1,1)'],
      ['=HF.GT("1","0")'],
      ['=HF.GT("1","1")'],
      ['=HF.GT(TRUE(),FALSE())'],
      ['=HF.GT(TRUE(),TRUE())'],
      ['=HF.GT(,)'],
      ['=HF.GT(1,)'],
      ['=HF.GT("1",)'],
      ['=HF.GT(TRUE(),)'],
      ['=HF.GT("1",1)'],
      ['=HF.GT(TRUE(),1)'],
      ['=HF.GT(TRUE(),"1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('A2'))).toEqual(false)
    expect(engine.getCellValue(adr('A3'))).toEqual(true)
    expect(engine.getCellValue(adr('A4'))).toEqual(false)
    expect(engine.getCellValue(adr('A5'))).toEqual(true)
    expect(engine.getCellValue(adr('A6'))).toEqual(false)
    expect(engine.getCellValue(adr('A7'))).toEqual(false)
    expect(engine.getCellValue(adr('A8'))).toEqual(true)
    expect(engine.getCellValue(adr('A9'))).toEqual(true)
    expect(engine.getCellValue(adr('A10'))).toEqual(true)
    expect(engine.getCellValue(adr('A11'))).toEqual(true)
    expect(engine.getCellValue(adr('A12'))).toEqual(true)
    expect(engine.getCellValue(adr('A13'))).toEqual(true)
  })

  it('should throw correct error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.GT(NA(),)'],
      ['=HF.GT(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
