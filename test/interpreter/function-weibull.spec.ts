import {HyperFormula} from '../../src'

describe('Function WEIBULL', () => {
  it('should be an alias of WEIBULL.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('WEIBULL')?.implementedFunctions!['WEIBULL']
    const metadata2 = engine.getFunctionPlugin('WEIBULL.DIST')?.implementedFunctions!['WEIBULL.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
