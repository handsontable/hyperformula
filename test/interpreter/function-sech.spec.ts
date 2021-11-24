import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SECH', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=SECH(0)', '=SECH(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.886818883970074)
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=SECH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=SECH()', '=SECH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="-1"', '=SECH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.648054273663886)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SECH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
