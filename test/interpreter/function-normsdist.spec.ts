import {HyperFormula} from '../../src'

describe('Function NORMSDIST', () => {
  it('should be an alias of NORM.S.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMSDIST')?.implementedFunctions!['NORMSDIST']
    const metadata2 = engine.getFunctionPlugin('NORM.S.DIST')?.implementedFunctions!['NORM.S.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
