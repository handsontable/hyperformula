import {HyperFormula} from '../../src'

describe('Function STDEVP', () => {
  it('should be an alias of STDEV.P', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('STDEVP')?.implementedFunctions!['STDEVP']
    const metadata2 = engine.getFunctionPlugin('STDEV.P')?.implementedFunctions!['STDEV.P']
    expect(metadata1).toEqual(metadata2)
  })
})
