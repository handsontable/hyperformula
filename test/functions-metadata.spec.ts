import {HyperFormula} from '../src'

describe('All functions', () => {
  it('should all contain metadata', () => {
    const [engine] = HyperFormula.buildEmpty()
    for (const functionId of engine.getRegisteredFunctionNames()) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const metadata = engine._functionRegistry.getMetadata(functionId)
      expect(metadata).not.toBe(undefined)
    }
  })

  it('should all contain param definition in metadata', () => {
    const [engine] = HyperFormula.buildEmpty()
    for (const functionId of engine.getRegisteredFunctionNames()) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const params = engine._functionRegistry.getMetadata(functionId)?.parameters
      expect(params).not.toBe(undefined)
    }
  })
})
