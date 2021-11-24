import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function RADIANS', () => {
  it('happy path',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['=RADIANS(0)', '=RADIANS(180.0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(3.1415)
  })

  it('given wrong argument type',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['=RADIANS("foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="180"', '=RADIANS(A1)'],
      ['=TRUE()', '=RADIANS(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(3.1415)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(0.017453292519943295)
  })

  it('given wrong number of arguments',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['=RADIANS()'],
      ['=RADIANS(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=RADIANS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
