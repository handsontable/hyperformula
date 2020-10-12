import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CONCAT', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CONCAT(1)', '=CONCAT(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CONCAT("hokuspokus","czarymary")'],
      ['=CONCAT(,"a")'],
      ['=CONCAT(,)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('hokuspokusczarymary')
    expect(engine.getCellValue(adr('A2'))).toEqual('a')
    expect(engine.getCellValue(adr('A3'))).toEqual('')
  })

  it('should coerce to correct types', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CONCAT(TRUE(),B1)'],
      ['=CONCAT(1,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('TRUE')
    expect(engine.getCellValue(adr('A2'))).toEqual('1')
  })

  it('should throw correct error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=CONCAT(NA(),)'],
      ['=CONCAT(B2:C2,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })
})
