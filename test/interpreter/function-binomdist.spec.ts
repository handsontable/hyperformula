import {HyperFormula} from '../../src'

describe('Function BINOMDIST', () => {
  it('should be an alias of BINOM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('BINOMDIST')?.implementedFunctions!['BINOMDIST']
    const metadata2 = engine.getFunctionPlugin('BINOM.DIST')?.implementedFunctions!['BINOM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
