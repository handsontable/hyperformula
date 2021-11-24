import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SEC', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=SEC(0)', '=SEC(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.85081571768093)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=SEC("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=SEC()', '=SEC(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=SEC(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(1.85081571768093)
  })

  it('close to div/zero', async() => {
const engine = await HyperFormula.buildFromArray([
      [1.57079632679486, '=SEC(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(27249001701268.1)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SEC(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
