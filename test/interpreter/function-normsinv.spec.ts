import {HyperFormula} from '../../src'

describe('Function NORMSINV', () => {
  it('should be an alias of NORM.S.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMSINV')?.implementedFunctions!['NORMSINV']
    const metadata2 = engine.getFunctionPlugin('NORM.S.INV')?.implementedFunctions!['NORM.S.INV']
    expect(metadata1).toEqual(metadata2)
  })
})
