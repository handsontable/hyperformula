import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function GTE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=GTE(1)', '=GTE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=GTE(1,0)'],
      ['=GTE(1,1)'],
      ['=GTE("1","0")'],
      ['=GTE("1","1")'],
      ['=GTE(TRUE(),FALSE())'],
      ['=GTE(TRUE(),TRUE())'],
      ['=GTE(,)'],
      ['=GTE(1,)'],
      ['=GTE("1",)'],
      ['=GTE(TRUE(),)'],
      ['=GTE("1",1)'],
      ['=GTE(TRUE(),1)'],
      ['=GTE(TRUE(),"1")'],
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
      ['=GTE(NA(),)'],
      ['=GTE(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
