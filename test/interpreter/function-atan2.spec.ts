import {Config, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ATAN2', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ATAN2(1,1)']], new Config({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toBe(0.7853981633974483)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ATAN2(1,"foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ATAN2()', '=ATAN2(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '="1"', '=ATAN2(A1,B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-0.785398163397448)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ATAN2(4/0, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ATAN2(1, A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
