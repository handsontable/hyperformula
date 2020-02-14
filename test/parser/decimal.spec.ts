import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe( 'decimal parsing', () => {
  it('parsing decimal without leading zero', () => {
    const engine = HyperFormula.buildFromArray([
      ['.1', '=.1'],
      ['-.1', '=-.1']
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(0.1)
    expect(engine.getCellValue(adr('B1'))).toBe(0.1)
    expect(engine.getCellValue(adr('A2'))).toBe(-0.1)
    expect(engine.getCellValue(adr('B2'))).toBe(-0.1)
  })
})
