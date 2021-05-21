import {HyperFormula} from '../../src'
import {expectEngineToBeTheSameAs} from '../testUtils'

describe('Add rows', () => {
  it('should be possible to add row above matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })
  
  it('adding row across array should not change array', () => {
    const engine = HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], { useArrayArithmetic: true })

    engine.addRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], { useArrayArithmetic: true }))
  })

  it('Adding row should expand dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], { useArrayArithmetic: true })

    engine.addRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], { useArrayArithmetic: true }))
  })
})
