import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('Small tests that check evaluation order', () => {
  it('passes #1', () => {
    const engine = HyperFormula.buildFromArray([
      [500, '=(1-B2)*A1', '=(1-B2)*B1'],
      ['=A1', 0.2, '=B2'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBe(500)
    expect(engine.getCellValue(adr('A2'))).toBe(500)
    expect(engine.getCellValue(adr('B2'))).toBe(0.2)
    expect(engine.getCellValue(adr('B1'))).toBe(400)
    expect(engine.getCellValue(adr('C1'))).toBe(320)
    expect(engine.getCellValue(adr('C2'))).toBe(0.2)
  })

  it('passes #2', () => {
    const engine = HyperFormula.buildFromArray([
      [500, '=(1-B2)*A2', '=(1-C2)*B1'],
      ['=A1', 0.2, '=B2'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBe(500)
    expect(engine.getCellValue(adr('A2'))).toBe(500)
    expect(engine.getCellValue(adr('B2'))).toBe(0.2)
    expect(engine.getCellValue(adr('B1'))).toBe(400)
    expect(engine.getCellValue(adr('C1'))).toBe(320)
    expect(engine.getCellValue(adr('C2'))).toBe(0.2)
  })
})
