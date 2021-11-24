import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LOG10', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=LOG10(10)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=LOG10("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('for zero', async() => {
const engine = await HyperFormula.buildFromArray([['=LOG10(0)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('for negative arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=LOG10(-42)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=LOG10()', '=LOG10(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="10"', '=LOG10(A1)'],
      ['', '=LOG10(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBe(1)
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=LOG10(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
