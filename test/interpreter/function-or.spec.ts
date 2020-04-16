import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function OR', () => {
  it('usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR(TRUE())', '=OR(FALSE())', '=OR(FALSE(), TRUE(), FALSE())', '=OR("asdf")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR("TRUE", 0)'],
      ['=OR("foo", 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
  })

  it('function OR with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR(1)', '=OR(0)', '=OR(FALSE(), 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('function OR takes at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=OR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('if error in range found, returns first one in row-by-row order', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '=4/0'],
      ['=FOOBAR()', '1'],
      ['=OR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('works with ranges', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '0'],
      ['0', '1'],
      ['=OR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(true)
  })

  it('is computed eagerly', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['0', '1'],
      ['=OR(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
