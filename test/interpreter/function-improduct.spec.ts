import {CellValue, ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {complex} from '../../src/interpreter/ArithmeticHelper'
import {adr, detailedError, expectToBeCloseForComplex} from '../testUtils'

describe('Function IMPRODUCT', () => {
  it('should return error for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPRODUCT()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should coerce explicit arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPRODUCT(0)'],
      ['=IMPRODUCT("i", "-1.5")'],
      ['=IMPRODUCT("-3+4i", "1+i", 1, 2, "3")'],
      ['=IMPRODUCT("i",)'],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A1'))), coerce('0'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))), coerce('-1.5i'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))), coerce('-42+6i'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A4'))), coerce('i'), 6)
  })

  it('should fail for non-coercible explicit arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPRODUCT(1, TRUE())'],
      ['=IMPRODUCT(2, "abcd")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ComplexNumberExpected))
  })

  it('should not coerce range arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IMPRODUCT(B1:C1)', 1, '2+i'],
      ['=IMPRODUCT(B2:D2)', 1, null, null],
      ['=IMPRODUCT(B3:D3)', 'i', 'abcd', true],
      ['=IMPRODUCT(B4:D4,)', 'i', '=NA()', 1],
    ])

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A1'))), coerce('2+i'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A2'))), coerce('1'), 6)
    expectToBeCloseForComplex(coerce(engine.getCellValue(adr('A3'))), coerce('i'), 6)
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA))
  })
})
