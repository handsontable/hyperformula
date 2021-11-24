import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMCSC', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMCSC()'],
      ['=IMCSC(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMCSC("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMCSC(0)'],
      ['=IMCSC("i")'],
      ['=IMCSC("-3+4i")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expectToBeCloseForComplex(engine, 'A2', '-0.850918128239322i')
    expectToBeCloseForComplex(engine, 'A3', '-0.0051744731840194+0.036275889628626i')
  })
})
