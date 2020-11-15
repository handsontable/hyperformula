import {HyperFormula} from '../../src'

describe('Function CONFIDENCE', () => {
  it('should be an alias of EXPON.NORM', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('CONFIDENCE')?.implementedFunctions!['CONFIDENCE']
    const metadata2 = engine.getFunctionPlugin('CONFIDENCE.NORM')?.implementedFunctions!['CONFIDENCE.NORM']
    expect(metadata1).toEqual(metadata2)
  })
})
