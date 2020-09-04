import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function SINH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=SINH(0)', '=SINH(0.5)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.521095305493747)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=SINH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=SINH()', '=SINH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=SINH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-1.1752011936438)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=SINH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=SINH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
