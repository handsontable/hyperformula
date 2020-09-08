import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessages} from '../../src/error-messages'
import {adr, detailedError} from '../testUtils'

describe('Function SECH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=SECH(0)', '=SECH(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.886818883970074)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=SECH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessages.NumberCoercion))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SECH()', '=SECH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=SECH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.648054273663886)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SECH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=SECH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
