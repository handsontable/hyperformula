import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMCOS', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCOS()'],
      ['=IMCOS(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCOS("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCOS(0)'],
      ['=IMCOS("i")'],
      ['=IMCOS("-3+4i")'],
    ])

    expectToBeCloseForComplex(engine, 'A1', '1')
    expectToBeCloseForComplex(engine, 'A2', '1.5430806348')
    expectToBeCloseForComplex(engine, 'A3', '-27.0349456030742+3.85115333481178i')
  })
})
