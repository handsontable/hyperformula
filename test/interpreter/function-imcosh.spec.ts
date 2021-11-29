import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMCOSH', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCOSH()'],
      ['=IMCOSH(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCOSH("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMCOSH(0)'],
      ['=IMCOSH("i")'],
      ['=IMCOSH("-3+4i")'],
    ])

    expectToBeCloseForComplex(engine, 'A1', '1')
    expectToBeCloseForComplex(engine, 'A2', '0.5403023058681398')
    expectToBeCloseForComplex(engine, 'A3', '-6.58066304055116+7.58155274274655i')
  })
})
