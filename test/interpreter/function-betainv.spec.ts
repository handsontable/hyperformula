import {HyperFormula} from '../../src'

describe('Function BETAINV', () => {
  it('should be an alias of BETA.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('BETAINV')?.implementedFunctions!['BETAINV']
    const metadata2 = engine.getFunctionPlugin('BETA.INV')?.implementedFunctions!['BETA.INV']
    expect(metadata1).toEqual(metadata2)
  })
})
