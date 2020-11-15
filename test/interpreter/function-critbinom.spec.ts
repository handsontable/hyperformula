import {HyperFormula} from '../../src'

describe('Function CRITBINOM', () => {
  it('should be an alias of BINOM.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CRITBINOM')?.implementedFunctions!['CRITBINOM']
    const metadata2 = engine.getFunctionPlugin('BINOM.INV')?.implementedFunctions!['BINOM.INV']
    expect(metadata1).toEqual(metadata2)
  })
})
