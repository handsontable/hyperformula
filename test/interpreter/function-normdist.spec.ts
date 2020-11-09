import {HyperFormula} from '../../src'

describe('Function NORMDIST', () => {
  it('should be an alias of NORM.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('NORMDIST')?.implementedFunctions!['NORMDIST']
    const metadata2 = engine.getFunctionPlugin('NORM.DIST')?.implementedFunctions!['NORM.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
