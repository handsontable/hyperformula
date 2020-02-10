import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ODD', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ODD()', '=ODD(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works for positive numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ODD(1.3)', '=ODD(2.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(3)
    expect(engine.getCellValue(adr('B1'))).toBe(3)
  })

  it('works for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ODD(-1.3)', '=ODD(-2.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-3)
    expect(engine.getCellValue(adr('B1'))).toBe(-3)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ODD("42.3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(43)
  })

  it('propagates error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ODD(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=ODD(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
