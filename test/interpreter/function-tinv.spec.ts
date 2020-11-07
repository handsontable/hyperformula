import {HyperFormula} from '../../src'

describe('Function TINV', () => {
  it('should be an alias of T.INV.2T', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('TINV')?.implementedFunctions!['TINV']
    const metadata2 = engine.getFunctionPlugin('T.INV.2T')?.implementedFunctions!['T.INV.2T']
    expect(metadata1).toEqual(metadata2)
  })
})
