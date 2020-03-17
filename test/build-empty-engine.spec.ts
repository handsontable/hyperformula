import {HyperFormula} from '../src'
import './testConfig.ts'
import {Config} from '../src/Config'

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })
  xit('accepts config params', () => {
    const config = new Config()
    const engine = HyperFormula.buildEmpty(config)
    expect(engine.config).toBe(config)
  })
})
