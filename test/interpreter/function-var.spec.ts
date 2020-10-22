import {HyperFormula} from '../../src'

describe('Function VAR', () => {
  it('should be an alias of VAR.S', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('VAR')?.implementedFunctions!['VAR']
    const metadata2 = engine.getFunctionPlugin('VAR.S')?.implementedFunctions!['VAR.S']
    expect(metadata1).toEqual(metadata2)
  })
})
