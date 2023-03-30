import { adr } from '../testUtils'
import { Config } from '../../src/Config'
import { CombinedTransformer } from '../../src/dependencyTransformers/CombinedTransformer'
import { HyperFormula } from '../../src'
import { buildEmptyParserWithCaching } from '../parser/common'
import { AbsoluteCellRange } from '../../src/AbsoluteCellRange'

describe('CombinedTransformer', () => {

  it('performEagerTransformations() coverage', () => {
    const transformer = new CombinedTransformer(0)
    const parser = buildEmptyParserWithCaching(new Config())
    
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])

    transformer.performEagerTransformations(engine.dependencyGraph, parser)

    expect(engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))).toEqual([
      [1, 2],
      [3, 4],
    ])

    expect(transformer.isIrreversible()).toEqual(true)
  })

})
