import {HyperFormula} from '../src'

describe('should work', () => {
  it('should not fail', () => {
    const engine = HyperFormula.buildEmpty()
    expect(() => engine.destroy()).not.toThrow()
    const engine2 = HyperFormula.buildEmpty()
    expect(() => engine2.destroy()).not.toThrow()
  })

  it('should fail', () => {
    const engine = HyperFormula.buildEmpty()
    engine.destroy()
    expect(() => engine.getConfig()).toThrow()
  })
})
