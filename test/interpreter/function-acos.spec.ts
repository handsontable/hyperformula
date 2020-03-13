import {buildConfig, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ACOS', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('for 1 (edge)', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('for -1 (edge)', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(-1)']],
      buildConfig({ smartRounding : false }))

    expect(engine.getCellValue(adr('A1'))).toEqual(Math.PI)
  })

  it('when value too large', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('when value too small', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS(-1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ACOS()', '=ACOS(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=ACOS(A1)'],
      ['=TRUE()', '=ACOS(A2)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(3.141592654)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(0)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ACOS(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ACOS(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
