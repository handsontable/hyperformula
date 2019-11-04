import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe("Function AND", () => {
  it('usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AND(TRUE(), TRUE())', '=AND(TRUE(), FALSE())', '=AND(TRUE(), "asdf")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('with numerical arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AND(1)', '=AND(0)', '=AND(1, TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AND("TRUE", 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
  })

  it('if error in range found, returns first one in row-by-row order', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '1'],
      ['=AND(A1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('works with ranges', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=AND(A1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(true)
  })

  it('takes at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=AND()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })
})
