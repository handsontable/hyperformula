import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ATANH', () => {
  it('happy path', async() => {
const engine = await HyperFormula.buildFromArray([['=ATANH(0)', '=ATANH(0.5)']], { smartRounding : false})

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.5493061443340548)
  })

  it('error for 1', async() => {
const engine = await HyperFormula.buildFromArray([['=ATANH(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('error for -1', async() => {
const engine = await HyperFormula.buildFromArray([['=ATANH(-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
  })

  it('when value not numeric', async() => {
const engine = await HyperFormula.buildFromArray([['=ATANH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('wrong number of arguments', async() => {
const engine = await HyperFormula.buildFromArray([['=ATANH()', '=ATANH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('use number coercion',  async() => {
const engine = await HyperFormula.buildFromArray([
      ['="0"', '=ATANH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('errors propagation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ATANH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
