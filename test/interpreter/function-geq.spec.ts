import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function GEQ', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=GEQ(1)', '=GEQ(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=GEQ(1,0)'],
      ['=GEQ(1,1)'],
      ['=GEQ("1","0")'],
      ['=GEQ("1","1")'],
      ['=GEQ(TRUE(),FALSE())'],
      ['=GEQ(TRUE(),TRUE())'],
      ['=GEQ(,)'],
      ['=GEQ(1,)'],
      ['=GEQ("1",)'],
      ['=GEQ(TRUE(),)'],
      ['=GEQ("1",1)'],
      ['=GEQ(TRUE(),1)'],
      ['=GEQ(TRUE(),"1")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('A2'))).toEqual(true)
    expect(engine.getCellValue(adr('A3'))).toEqual(true)
    expect(engine.getCellValue(adr('A4'))).toEqual(true)
    expect(engine.getCellValue(adr('A5'))).toEqual(true)
    expect(engine.getCellValue(adr('A6'))).toEqual(true)
    expect(engine.getCellValue(adr('A7'))).toEqual(true)
    expect(engine.getCellValue(adr('A8'))).toEqual(true)
    expect(engine.getCellValue(adr('A9'))).toEqual(true)
    expect(engine.getCellValue(adr('A10'))).toEqual(true)
    expect(engine.getCellValue(adr('A11'))).toEqual(true)
    expect(engine.getCellValue(adr('A12'))).toEqual(true)
    expect(engine.getCellValue(adr('A13'))).toEqual(true)
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=GEQ(NA(),)'],
      ['=GEQ(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
