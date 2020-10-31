import {HyperFormula} from '../../src'

describe('Function GAMMADIST', () => {
  it('should be an alias of GAMMA.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('GAMMADIST')?.implementedFunctions!['GAMMADIST']
    const metadata2 = engine.getFunctionPlugin('GAMMA.DIST')?.implementedFunctions!['GAMMA.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
