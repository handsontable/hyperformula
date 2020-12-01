import {CellValue, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {complex} from '../../src/interpreter/ArithmeticHelper'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMSUM', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMSUM(1)'],
      ['=IMSUM(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMSUM("foo", 1)'],
      ['=IMSUM(1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMSUM(0, 1)'],
      ['=IMSUM("i", "-i")'],
      ['=IMSUM("-3+4i", "1+i")'],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A1'))),coerce("1"),6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))),coerce("0"),6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))),coerce("-2+5i"),6)
  })
})
