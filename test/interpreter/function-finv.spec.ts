import {HyperFormula} from '../../src'

describe('Function FINV', () => {
  it('should be an alias of F.INV.RT', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('FINV')?.implementedFunctions!['FINV']
    const metadata2 = engine.getFunctionPlugin('F.INV.RT')?.implementedFunctions!['F.INV.RT']
    expect(metadata1).toEqual(metadata2)
  })
})
