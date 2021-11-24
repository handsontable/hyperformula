import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LN', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=LN(2.718281828459045)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=LN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('for zero', async() => {
const engine = await HyperFormula.buildFromArray([['=LN(0)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('for negative arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=LN(-42)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=LN()', '=LN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="2.718281828459045"', '=LN(A1)'],
      ['', '=LN(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
