import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CSC', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=CSC(PI()/2)', '=CSC(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.18839510577812)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=CSC("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=CSC()', '=CSC(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=CSC(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-1.18839510577812)
  })

  it('div/zero', async() => {
const engine = await HyperFormula.buildFromArray([
      [0, '=CSC(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=CSC(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
