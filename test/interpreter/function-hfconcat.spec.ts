import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HF.CONCAT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.CONCAT(1)', '=HF.CONCAT(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.CONCAT("hokuspokus","czarymary")'],
      ['=HF.CONCAT(,"a")'],
      ['=HF.CONCAT(,)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('hokuspokusczarymary')
    expect(engine.getCellValue(adr('A2'))).toEqual('a')
    expect(engine.getCellValue(adr('A3'))).toEqual('')
  })

  it('should coerce to correct types', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.CONCAT(TRUE(),B1)'],
      ['=HF.CONCAT(1,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('TRUE')
    expect(engine.getCellValue(adr('A2'))).toEqual('1')
  })

  it('should throw correct error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=HF.CONCAT(NA(),)'],
      ['=HF.CONCAT(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
