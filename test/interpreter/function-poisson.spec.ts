import {HyperFormula} from '../../src'

describe('Function POISSON', () => {
  it('should be an alias of POISSON.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('POISSON')?.implementedFunctions!['POISSON']
    const metadata2 = engine.getFunctionPlugin('POISSON.DIST')?.implementedFunctions!['POISSON.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
