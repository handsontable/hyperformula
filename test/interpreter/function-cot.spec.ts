import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COT', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=COT(1)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.642092615934331)
  })

  it('DIV/0 for zero', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COT(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=COT("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=COT()', '=COT(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=COT(A1)'],
      ['', '=COT(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.642092615934331)
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COT(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
