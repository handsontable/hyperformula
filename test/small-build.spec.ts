import {HyperFormula} from '../src'

describe('Small tests that check evaluation order', () => {
  it('passes #1', () => {
    const [engine] = HyperFormula.buildFromArray([
      [500, '=(1-B2)*A1', '=(1-B2)*B1'],
      ['=A1', 0.2, '=B2'],
    ])
    expect(engine.getSheetValues(0)).toEqual([
      [500, 400, 320],
      [500, 0.2, 0.2]
    ])
  })

  it('passes #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      [500, '=(1-B2)*A2', '=(1-C2)*B1'],
      ['=A1', 0.2, '=B2'],
    ])
    expect(engine.getSheetValues(0)).toEqual([
      [500, 400, 320],
      [500, 0.2, 0.2]
    ])
  })
})
