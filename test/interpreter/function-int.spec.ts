import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function INT', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=INT()', '=INT(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works for positive numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=INT(1.3)', '=INT(1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('works for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=INT(-1.3)', '=INT(-1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-1)
    expect(engine.getCellValue(adr('B1'))).toBe(-1)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=INT("42.3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(42)
  })

  it('propagates error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=INT(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=INT(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
