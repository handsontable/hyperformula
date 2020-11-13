import {HyperFormula} from '../../src'

describe('Function LOGNORMDIST', () => {
  it('should be an alias of LOGNORM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('LOGNORMDIST')?.implementedFunctions!['LOGNORMDIST']
    const metadata2 = engine.getFunctionPlugin('LOGNORM.DIST')?.implementedFunctions!['LOGNORM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
