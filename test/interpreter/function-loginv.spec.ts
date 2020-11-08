import {HyperFormula} from '../../src'

describe('Function LOGINV', () => {
  it('should be an alias of LOGNORM.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('LOGINV')?.implementedFunctions!['LOGINV']
    const metadata2 = engine.getFunctionPlugin('LOGNORM.INV')?.implementedFunctions!['LOGNORM.INV']
    expect(metadata1).toEqual(metadata2)
  })
})
