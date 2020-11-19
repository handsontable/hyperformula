import {HyperFormula} from '../../src'

describe('Function FTEST', () => {
  it('should be an alias of F.TEST', () => {
    const engine = HyperFormula.buildEmpty()
    const metadata1 = engine.getFunctionPlugin('FTEST')?.implementedFunctions!['FTEST']
    const metadata2 = engine.getFunctionPlugin('F.TEST')?.implementedFunctions!['F.TEST']
    expect(metadata1).toEqual(metadata2)
  })
})
