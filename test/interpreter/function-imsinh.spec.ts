import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMSINH', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMSINH()'],
      ['=IMSINH(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMSINH("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMSINH(0)'],
      ['=IMSINH("i")'],
      ['=IMSINH("-3+4i")'],
    ])

    expectToBeCloseForComplex(engine, 'A1', '0')
    expectToBeCloseForComplex(engine, 'A2', '0.841470984807897i')
    expectToBeCloseForComplex(engine, 'A3', '6.548120040911-7.61923172032141i')
  })
})
