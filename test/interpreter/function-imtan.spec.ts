import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMTAN', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMTAN()'],
      ['=IMTAN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMTAN("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMTAN(0)'],
      ['=IMTAN("i")'],
      ['=IMTAN("-3+4i")'],
    ])

    expectToBeCloseForComplex(engine, 'A1', '0')
    expectToBeCloseForComplex(engine, 'A2', '0.761594155955765i')
    expectToBeCloseForComplex(engine, 'A3', '0.000187346204629478+0.999355987381473i')
  })
})
