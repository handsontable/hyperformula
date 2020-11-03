import {HyperFormula} from '../../src'

describe('Function HYPGEOMDIST', () => {
  it('should be an alias of HYPGEOM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('HYPGEOMDIST')?.implementedFunctions!['HYPGEOMDIST']
    const metadata2 = engine.getFunctionPlugin('HYPGEOM.DIST')?.implementedFunctions!['HYPGEOM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
