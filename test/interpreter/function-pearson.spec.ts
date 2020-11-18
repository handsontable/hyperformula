import {HyperFormula} from '../../src'

describe('Function PEARSON', () => {
  it('should be an alias of CORREL', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('PEARSON')?.implementedFunctions!['PEARSON']
    const metadata2 = engine.getFunctionPlugin('CORREL')?.implementedFunctions!['CORREL']
    expect(metadata1).toEqual(metadata2)
  })
})
