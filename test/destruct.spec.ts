import {HyperFormula} from '../src'

describe('engine destruct', () => {
  it('should throw exception after destruct', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.destroy()
    expect(() => engine.getConfig()).toThrow()
  })

  it('should have keys removed', () => {
    const [engine] = HyperFormula.buildEmpty()
    engine.destroy()
    expect(engine?.dependencyGraph).toBeUndefined()
  })

  it('should not affect other instances', () => {
    const [engine1] =HyperFormula.buildEmpty()
    const [engine2] =HyperFormula.buildEmpty()
    engine1.destroy()
    const [engine3] =HyperFormula.buildEmpty()
    expect(() => engine2.getConfig()).not.toThrow()
    expect(() => engine3.getConfig()).not.toThrow()
  })

  it('should not affect static methods', () => {
    const [engine1] =HyperFormula.buildEmpty()
    engine1.destroy()
    expect(() => HyperFormula.getAllFunctionPlugins()).not.toThrow()
  })
})
