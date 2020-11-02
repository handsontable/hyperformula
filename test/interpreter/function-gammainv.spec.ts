import {HyperFormula} from '../../src'

describe('Function GAMMAINV', () => {
  it('should be an alias of GAMMA.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('GAMMAINV')?.implementedFunctions!['GAMMAINV']
    const metadata2 = engine.getFunctionPlugin('GAMMA.INV')?.implementedFunctions!['GAMMA.INV']
    expect(metadata1).toEqual(metadata2)
  })
})
