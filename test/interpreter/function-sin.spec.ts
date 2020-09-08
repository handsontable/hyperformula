import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessages} from '../../src/error-messages'
import {adr, detailedError} from '../testUtils'

describe('Function SIN', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=SIN(0)', '=SIN(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.479425538604203)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=SIN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessages.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SIN()', '=SIN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=SIN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.841470984807897)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SIN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=SIN(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
