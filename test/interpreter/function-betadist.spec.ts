import {HyperFormula} from '../../src'

describe('Function BETADIST', () => {
  it('should be an alias of BETA.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('BETADIST')?.implementedFunctions!['BETADIST']
    const metadata2 = engine.getFunctionPlugin('BETA.DIST')?.implementedFunctions!['BETA.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
