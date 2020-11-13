import {HyperFormula} from '../../src'

describe('Function FDIST', () => {
  it('should be an alias of F.DIST.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('FDIST')?.implementedFunctions!['FDIST']
    const metadata2 = engine.getFunctionPlugin('F.DIST.RT')?.implementedFunctions!['F.DIST.RT']
    expect(metadata1).toEqual(metadata2)
  })
})
