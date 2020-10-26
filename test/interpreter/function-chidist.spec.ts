import {HyperFormula} from '../../src'

describe('Function CHIDIST', () => {
  it('should be an alias of CHISQ.DIST.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CHIDIST')?.implementedFunctions!['CHIDIST']
    const metadata2 = engine.getFunctionPlugin('CHISQ.DIST.RT')?.implementedFunctions!['CHISQ.DIST.RT']
    expect(metadata1).toEqual(metadata2)
  })
})
