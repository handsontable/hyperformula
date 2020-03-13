import {buildConfig, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ASIN', () => {
  it('happy path', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN(0)']])

    expect(engine.getCellValue(adr('A1'))).toBe(0)
  })

  it('when value not numeric', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN("foo")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('for 1 (edge)', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN(1)']], buildConfig({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toBe(Math.PI / 2)
  })

  it('for -1 (edge)', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN(-1)']], buildConfig({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toEqual(-Math.PI / 2)
  })

  it('when value too large', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN(1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('when value too small', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN(-1.1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=ASIN()', '=ASIN(1,-1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('use number coercion',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="-1"', '=ASIN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-Math.PI / 2)
  })

  it('errors propagation', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=ASIN(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1', '=ASIN(A1:A3)'],
      ['-1'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
