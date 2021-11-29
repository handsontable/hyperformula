import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function IMCONJUGATE', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCONJUGATE()'],
      ['=IMCONJUGATE(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCONJUGATE("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCONJUGATE(0)'],
      ['=IMCONJUGATE("i")'],
      ['=IMCONJUGATE("-3+4i")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('0')
    expect(engine.getCellValue(adr('A2'))).toEqual('-i')
    expect(engine.getCellValue(adr('A3'))).toEqual('-3-4i')
  })
})
