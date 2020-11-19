import {HyperFormula} from '../../src'

describe('Function ZTEST', () => {
  it('should be an alias of Z.TEST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('ZTEST')?.implementedFunctions!['ZTEST']
    const metadata2 = engine.getFunctionPlugin('Z.TEST')?.implementedFunctions!['Z.TEST']
    expect(metadata1).toEqual(metadata2)
  })
})
