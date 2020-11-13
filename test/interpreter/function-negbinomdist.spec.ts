import {HyperFormula} from '../../src'

describe('Function NEGBINOMDIST', () => {
  it('should be an alias of NEGBINOM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NEGBINOMDIST')?.implementedFunctions!['NEGBINOMDIST']
    const metadata2 = engine.getFunctionPlugin('NEGBINOM.DIST')?.implementedFunctions!['NEGBINOM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
