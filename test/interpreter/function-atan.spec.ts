import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ATAN', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ATAN(1)']], { smartRounding : false})

    expect(engine.getCellValue(adr('A1'))).toBe(0.7853981633974483)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ATAN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ATAN()', '=ATAN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=ATAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.785398163397448)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ATAN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ATAN(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
