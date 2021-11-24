import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SIN', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=SIN(0)', '=SIN(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.479425538604203)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=SIN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=SIN()', '=SIN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=SIN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.841470984807897)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SIN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
