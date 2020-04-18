import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ISODD', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISODD()', '=ISODD(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISODD(1)', '=ISODD(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISODD("42")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
  })

  it('propagates error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ISODD(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=ISODD(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
