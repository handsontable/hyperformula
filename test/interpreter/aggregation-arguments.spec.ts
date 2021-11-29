import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('AVERAGE function', () => {
  it('should work for empty arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(1,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })

  it('should work for empty reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(A2,B2)'],
      [1, null]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should work for range with empty val', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(A2:B2)'],
      [1, null]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should work for empty reference + empty arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(A2,B2,)'],
      [1, null]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })

  it('should work for range with empty val + empty arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(A2:B2,)'],
      [1, null]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })

  it('should work for coercible arg', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(2,TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.5)
  })

  it('should work for coercible value in reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(A2,B2)'],
      [2, true]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('should work for coercible value in range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVERAGE(A2:B2)'],
      [2, true]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })
})
