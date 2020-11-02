import {HyperFormula} from '../../src'

describe('Function CHIINV', () => {
  it('should be an alias of CHISQ.INV.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CHIINV')?.implementedFunctions!['CHIINV']
    const metadata2 = engine.getFunctionPlugin('CHISQ.INV.RT')?.implementedFunctions!['CHISQ.INV.RT']
    expect(metadata1).toEqual(metadata2)
  })
})
