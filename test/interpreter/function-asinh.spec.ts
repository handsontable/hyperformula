import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ASINH', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ASINH(0)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ASINH("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })


  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ASINH()', '=ASINH(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=ASINH(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.881373587019543)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ASINH(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ASINH(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
