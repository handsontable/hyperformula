import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ACOT', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ACOT(0)', '=ACOT(1)']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.5707963267949)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.785398163397448)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ACOT("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ACOT()', '=ACOT(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, 'Wrong number of arguments.'))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=ACOT(A1)'],
      ['', '=ACOT(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-0.785398163397448)
    expect(engine.getCellValue(adr('B2'))).toEqual(1.5707963267949)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ACOT(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ACOT(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
