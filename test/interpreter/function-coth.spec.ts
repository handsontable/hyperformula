import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COTH', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=COTH(1)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.31303528549933)
  })

  it('DIV/0 for zero', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COTH(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=COTH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=COTH()', '=COTH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=COTH(A1)'],
      ['', '=COTH(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-1.31303528549933)
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=COTH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
