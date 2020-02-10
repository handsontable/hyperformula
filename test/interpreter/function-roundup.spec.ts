import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ROUNDUP', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ROUNDUP()', '=ROUNDUP(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works for positive numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ROUNDUP(1.3)', '=ROUNDUP(1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(2)
    expect(engine.getCellValue(adr('B1'))).toBe(2)
  })

  it('works for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ROUNDUP(-1.3)', '=ROUNDUP(-1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-2)
    expect(engine.getCellValue(adr('B1'))).toBe(-2)
  })

  it('works with positive rounding argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ROUNDUP(1.43, 1)', '=ROUNDUP(1.47, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1.5)
    expect(engine.getCellValue(adr('B1'))).toBe(1.5)
  })

  it('works with negative rounding argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ROUNDUP(43, -1)', '=ROUNDUP(47, -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(50)
    expect(engine.getCellValue(adr('B1'))).toBe(50)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ROUNDUP("42.3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(43)
  })

  it('propagates error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ROUNDUP(A1)', '=ROUNDUP(42, A1)', '=ROUNDUP(A1, FOO())'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=ROUNDUP(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=ROUNDUP(42.234, A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
