import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Operator DIVISION', () => {
  it('works for obvious case', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=9/3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
  })

  it('returns div when dividing by zero', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=10/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('use number coerce', async() => {
const engine = await HyperFormula.buildFromArray([
      ['="9"/"3"'],
      ['="foobar"/1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('pass error from left operand', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A2/3'],
      ['=FOOBAR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('pass error from right operand', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=3/A2'],
      ['=FOOBAR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('pass error from left operand if both operands have error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A2/B2'],
      ['=FOOBAR()', '=4/0'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('range value results in VALUE error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['9'],
      ['3'],
      ['=10 / A1:A3'],
      ['=A1:A3 / 10'],
    ], {useArrayArithmetic: false})

    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('Division propagates errors correctly', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=(1/0)/2', '=2/(1/0)', '=(A1:B1)/(1/0)', '=(1/0)/(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('E1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
    expect(engine.getCellValue(adr('F1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
