import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Operator PLUS', () => {
  it('works for obvious case', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=2+3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
  })

  it('use number coerce', async() => {
const engine = await HyperFormula.buildFromArray([
      ['="2"+"3"'],
      ['="foobar"+1'],
      ['\'3'],
      ['=A3+A3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(5)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A4'))).toEqual(6)
  })

  it('pass error from left operand', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A2+3'],
      ['=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('pass error from right operand', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3+A2'],
      ['=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('pass error from left operand if both operands have error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A2+B2'],
      ['=FOOBAR()', '=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('range value results in VALUE error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=10 + A1:A3'],
      ['=A1:A3 + 10'],
    ], {useArrayArithmetic: false})

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('Plus propagates errors correctly', async() => {
const engine = await HyperFormula.buildFromArray([
      [0b1, '2', '=(1/0)+2', '=2+(1/0)', '=(A1:B1)+(1/0)', '=(1/0)+(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('E1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
