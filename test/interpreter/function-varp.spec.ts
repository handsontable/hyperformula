import {HyperFormula} from '../../src'

describe('Function VARP', () => {
  it('should be an alias of VAR.P', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('VARP')?.implementedFunctions!['VARP']
    const metadata2 = engine.getFunctionPlugin('VAR.P')?.implementedFunctions!['VAR.P']
    expect(metadata1).toEqual(metadata2)
  })
})
