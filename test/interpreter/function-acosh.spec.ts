import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ACOSH', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOSH(1)', '=ACOSH(2)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.31695789692482)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOSH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('too small', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOSH(0.9)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })


  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOSH()', '=ACOSH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="1"', '=ACOSH(A1)'],
      ['=TRUE()', '=ACOSH(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
    expect(engine.getCellValue(adr('B2'))).toEqual(0)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ACOSH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
