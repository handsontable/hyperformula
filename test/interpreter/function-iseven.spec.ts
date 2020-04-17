import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ISEVEN', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISEVEN()', '=ISEVEN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISEVEN(1)', '=ISEVEN(2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISEVEN("42")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
  })

  it('propagates error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ISEVEN(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1'],
      ['=2', '=ISEVEN(A1:A2)'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
