import {HyperFormula} from '../../src'

describe('Function NORMINV', () => {
  it('should be an alias of NORM.INV', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMINV')?.implementedFunctions!['NORMINV']
    const metadata2 = engine.getFunctionPlugin('NORM.INV')?.implementedFunctions!['NORM.INV']
    expect(metadata1).toEqual(metadata2)
  })
})
