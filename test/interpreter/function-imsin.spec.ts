import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMSIN', () => {
  it('should return error for wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMSIN()'],
      ['=IMSIN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMSIN("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=IMSIN(0)'],
      ['=IMSIN("i")'],
      ['=IMSIN("-3+4i")'],
    ])

    expectToBeCloseForComplex(engine, 'A1', '0')
    expectToBeCloseForComplex(engine, 'A2', '1.1752011936438i')
    expectToBeCloseForComplex(engine, 'A3', '-3.85373803791938-27.0168132580039i')
  })
})
