import {HyperFormula} from '../../src'

describe('Function COVAR', () => {
  it('should be an alias of COVARIANCE.P', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('COVAR')?.implementedFunctions!['COVAR']
    const metadata2 = engine.getFunctionPlugin('COVARIANCE.P')?.implementedFunctions!['COVARIANCE.P']
    expect(metadata1).toEqual(metadata2)
  })
})
