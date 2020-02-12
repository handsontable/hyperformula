import {Config, HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('string comparison', () => {
  it('comparison default', () => {
    const engine = HyperFormula.buildFromArray([
      ['a', 'A', '=A1>B1'],
      ['aa', 'AA', '=A2>B2'],
      ['aA', 'aa', '=A3>B3'],
      ['Aa', 'aa', '=A4>B4'],
    ])

    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('C2'))).toBe(false)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })

  it('comparison case sensitive', () => {
    const engine = HyperFormula.buildFromArray([
      ['a', 'A', '=A1>B1'],
      ['aa', 'AA', '=A2>B2'],
      ['aA', 'aa', '=A3>B3'],
      ['Aa', 'aa', '=A4>B4'],
    ], new Config({caseSensitive: true}))

    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('C2'))).toBe(true)
    expect(engine.getCellValue(adr('C3'))).toBe(false)
    expect(engine.getCellValue(adr('C4'))).toBe(false)
  })
})
