import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMSECH', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSECH()'],
      ['=IMSECH(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSECH("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=IMSECH(0)'],
      ['=IMSECH("i")'],
      ['=IMSECH("-3+4i")'],
    ])

    expectToBeCloseForComplex(engine, 'A1', '1')
    expectToBeCloseForComplex(engine, 'A2', '1.85081571768093')
    expectToBeCloseForComplex(engine, 'A3', '-0.0652940278579471-0.0752249603027732i')
  })
})
