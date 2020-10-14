import {HyperFormula} from '../../src'

describe('Function STDEV', () => {
  it('should be an alias of STDEV.S', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('STDEV')?.implementedFunctions!['STDEV']
    const metadata2 = engine.getFunctionPlugin('STDEV.S')?.implementedFunctions!['STDEV.S']
    expect(metadata1).toEqual(metadata2)
  })
})
