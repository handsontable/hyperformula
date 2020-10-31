import {HyperFormula} from '../../src'

describe('Function GAMMALN.PRECISE', () => {
  it('should be an alias of GAMMALN', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('GAMMALN.PRECISE')?.implementedFunctions!['GAMMALN.PRECISE']
    const metadata2 = engine.getFunctionPlugin('GAMMALN')?.implementedFunctions!['GAMMALN']
    expect(metadata1).toEqual(metadata2)
  })
})
