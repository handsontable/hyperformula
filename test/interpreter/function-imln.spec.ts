import {CellValue, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {complex} from '../../src/interpreter/ArithmeticHelper'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMLN', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMLN()'],
      ['=IMLN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMLN("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMLN(0)'],
      ['=IMLN("i")'],
      ['=IMLN("-3+4i")'],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))), coerce('1.5707963267949i'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))), coerce('1.6094379124341+2.21429743558818i'), 6)
  })
})
