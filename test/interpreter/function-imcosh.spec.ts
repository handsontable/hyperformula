import {CellValue, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {complex} from '../../src/interpreter/ArithmeticHelper'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMCOSH', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMCOSH()'],
      ['=IMCOSH(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMCOSH("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMCOSH(0)'],
      ['=IMCOSH("i")'],
      ['=IMCOSH("-3+4i")'],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A1'))), coerce('1'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))), coerce('0.5403023058681398'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))), coerce('-6.58066304055116+7.58155274274655i'), 6)
  })
})
