import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.NE', () => {
  it('should return #NA! error with the wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HF.NE(1)', '=HF.NE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HF.NE(1,0)'],
      ['=HF.NE(1,1)'],
      ['=HF.NE("1","0")'],
      ['=HF.NE("1","1")'],
      ['=HF.NE(TRUE(),FALSE())'],
      ['=HF.NE(TRUE(),TRUE())'],
      ['=HF.NE(,)'],
      ['=HF.NE(1,)'],
      ['=HF.NE("1",)'],
      ['=HF.NE(TRUE(),)'],
      ['=HF.NE("1",1)'],
      ['=HF.NE(TRUE(),1)'],
      ['=HF.NE(TRUE(),"1")'],
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

  it('should throw correct error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=HF.NE(NA(),)'],
      ['=HF.NE(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
