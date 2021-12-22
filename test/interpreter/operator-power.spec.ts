import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Operator POWER', () => {
  it('works for obvious case', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=8^3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(512)
  })

  it('use number coerce', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['="8"^"3"'],
      ['="foobar"^1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(512)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('pass error from left operand', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2^3'],
      ['=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('pass error from right operand', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=3^A2'],
      ['=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('pass error from left operand if both operands have error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2^B2'],
      ['=FOOBAR()', '=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('range value results in VALUE error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['8'],
      ['3'],
      ['=10 ^ A1:A3'],
      ['=A1:A3 ^ 10'],
    ], {useArrayArithmetic: false})

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('Power propagates errors correctly', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=(1/0)^2', '=2^(1/0)', '=(A1:B1)^(1/0)', '=(1/0)^(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('E1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('NaN as a result', () => {

    const [engine] = HyperFormula.buildFromArray([
      ['01/02/1999', '02/02/1999', '=A1^B1'],
      ['3.1415', '36193.2', '=A2^B2'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('C2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })
})
