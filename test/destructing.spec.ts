import {HyperFormula} from '../src'

describe('should work', () => {
  it('should not fail', () => {
    const engine = HyperFormula.buildEmpty()
    expect(() => engine.destroy()).not.toThrow()
  })

  it('should fail', () => {
    const engine = HyperFormula.buildEmpty()
    engine.destroy()
    expect(() => engine.getConfig()).toThrow('engine.getConfig is not a function')
  })
})
