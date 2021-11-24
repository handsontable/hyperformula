import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ACOS', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.0471975511966)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('for 1 (edge)', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('for -1 (edge)', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS(-1)']],
      { smartRounding : false })

    expect(engine.getCellValue(adr('A1'))).toEqual(Math.PI)
  })

  it('when value too large', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS(1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('when value too small', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS(-1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOS()', '=ACOS(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=ACOS(A1)'],
      ['=TRUE()', '=ACOS(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(3.141592654)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(0)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ACOS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
