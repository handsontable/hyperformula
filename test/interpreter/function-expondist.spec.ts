import {HyperFormula} from '../../src'

describe('Function EXPONDIST', () => {
  it('should be an alias of EXPON.DIST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('EXPONDIST')?.implementedFunctions!['EXPONDIST']
    const metadata2 = engine.getFunctionPlugin('EXPON.DIST')?.implementedFunctions!['EXPON.DIST']
    expect(metadata1).toEqual(metadata2)
  })
})
