import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('"Value of the formula cell is not computed" (sample 01)', () => {
  it('passes for "=B1*(1+B2)"', () => {
    // given
    const engine = HyperFormula.buildFromArray([
      [1000, '=A1*(1+B2)', '=B1*(1+B2)'],
      ['', 0.1, '=B2'],
    ])
    // then for static values
    expect(engine.getCellValue(adr('A1'))).toBe(1000)
    expect(engine.getCellValue(adr('A2'))).toBe('')
    expect(engine.getCellValue(adr('B2'))).toBe(0.1)
    // and for formulas
    expect(engine.getCellValue(adr('B1'))).toBe(1100)
    expect(engine.getCellValue(adr('C1'))).toBe(1210)
    expect(engine.getCellValue(adr('C2'))).toBe(0.1)
  })

  it('FAILS for "=B1*(1+C2)"', () => {
    // given
    const engine = HyperFormula.buildFromArray([
      [1000, '=A1*(1+B2)', '=B1*(1+C2)'],
      ['', 0.1, '=B2'],
    ])
    // then for static values
    expect(engine.getCellValue(adr('A1'))).toBe(1000)
    expect(engine.getCellValue(adr('A2'))).toBe('')
    expect(engine.getCellValue(adr('B2'))).toBe(0.1)
    // and for formulas
    expect(engine.getCellValue(adr('B1'))).toBe(1100)
    expect(engine.getCellValue(adr('C1'))).toBe(1210)
    expect(engine.getCellValue(adr('C2'))).toBe(0.1)
  })
})
