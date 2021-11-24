import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ACOT', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOT(0)', '=ACOT(1)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.5707963267949)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.785398163397448)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOT("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=ACOT()', '=ACOT(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=ACOT(A1)'],
      ['', '=ACOT(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.785398163397448)
    expect(engine.getCellValue(adr('B2'))).toEqual(1.5707963267949)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ACOT(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
