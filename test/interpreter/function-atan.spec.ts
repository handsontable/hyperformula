import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ATAN', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=ATAN(1)']], { smartRounding : false})

    expect(engine.getCellValue(adr('A1'))).toBe(0.7853981633974483)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=ATAN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=ATAN()', '=ATAN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=ATAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.785398163397448)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ATAN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
