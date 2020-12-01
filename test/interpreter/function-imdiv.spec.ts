import {CellValue, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {complex} from '../../src/interpreter/ArithmeticHelper'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMDIV', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMDIV(1)'],
      ['=IMDIV(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMDIV("foo", 1)'],
      ['=IMDIV(1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMDIV(0, 1)'],
      ['=IMDIV("i", "-i")'],
      ['=IMDIV("-3+4i", "1+i")'],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A1'))),coerce("0"),6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))),coerce("-1"),6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))),coerce("0.5+3.5i"),6)
  })
})
