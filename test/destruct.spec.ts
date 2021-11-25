import {HyperFormula} from '../src'

describe('engine destruct', () => {
  it('should throw exception after destruct', async() => {
const engine = await HyperFormula.buildEmpty()
    engine.destroy()
    expect(() => engine.getConfig()).toThrow()
  })

  it('should have keys removed', async() => {
const engine = await HyperFormula.buildEmpty()
    engine.destroy()
    expect(engine?.dependencyGraph).toBeUndefined()
  })

  it('should not affect other instances', async() => {
    const engine1 = await HyperFormula.buildEmpty()
    const engine2 = await HyperFormula.buildEmpty()
    engine1.destroy()
    const engine3 = await HyperFormula.buildEmpty()
    expect(() => engine2.getConfig()).not.toThrow()
    expect(() => engine3.getConfig()).not.toThrow()
  })

  it('should not affect static methods', async() => {
    const engine1 = await HyperFormula.buildEmpty()
    engine1.destroy()
    expect(() => HyperFormula.getAllFunctionPlugins()).not.toThrow()
  })
})
