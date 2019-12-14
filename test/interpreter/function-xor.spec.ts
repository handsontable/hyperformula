import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe("Function XOR", () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XOR(TRUE(), TRUE())'],
      ['=XOR(TRUE(), FALSE())'],
      ['=XOR(FALSE(), TRUE())'],
      ['=XOR(FALSE(), FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
    expect(engine.getCellValue(adr('A4'))).toBe(false)
  })

  it('at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XOR()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('for one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XOR(TRUE())'],
      ['=XOR(FALSE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
  })

  xit('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XOR("TRUE")'],
      ['=XOR(1)'],
      ['=XOR(1, "foo")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(true)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
  })

  it('when no coercible to number arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XOR("foo")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('returns TRUE iff odd number of TRUEs present', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XOR(TRUE(), TRUE(), TRUE())'],
      ['=XOR(TRUE(), TRUE(), TRUE(), TRUE())'],
      ['=XOR(TRUE(), TRUE(), TRUE(), TRUE(), TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('A2'))).toBe(false)
    expect(engine.getCellValue(adr('A3'))).toBe(true)
  })

  it('if error in range found, returns first one in row-by-row order', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '=4/0'],
      ['=FOOBAR()', '1'],
      ['=XOR(A1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('works with ranges', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '0'],
      ['0', '1'],
      ['=XOR(A1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(true)
  })

  it('is computed eagerly', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['0', '1'],
      ['=XOR(A1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})
