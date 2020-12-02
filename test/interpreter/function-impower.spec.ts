import {CellValue, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {complex} from '../../src/interpreter/ArithmeticHelper'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMPOWER', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPOWER(1)'],
      ['=IMPOWER(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPOWER("foo", 2)'],
      ['=IMPOWER(1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPOWER(0, 1)'],
      ['=IMPOWER("-4", 0.1)'],
      ['=IMPOWER("-3+4i", -1)'],
      ['=IMPOWER(0, -1)'],
      ['=IMPOWER(0, 0)'],
      ['=IMPOWER("i", 0)'],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A1'))), coerce('0'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))), coerce('1.09247705577745+0.35496731310463i'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))), coerce('-0.12-0.16i'), 6)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A6'))), coerce('1'), 6)
  })
})
