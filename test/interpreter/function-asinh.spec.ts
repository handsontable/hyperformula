import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ASINH', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=ASINH(0)', '=ASINH(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.481211825059604)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=ASINH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })


  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=ASINH()', '=ASINH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=ASINH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.881373587019543)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ASINH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
