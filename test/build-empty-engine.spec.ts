import {buildConfig, HyperFormula} from '../src'
import './testConfig.ts'

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('accepts config', () => {
    const config = buildConfig()
    const engine = HyperFormula.buildEmpty(config)
    expect(engine.config).toBe(config)
  })
})
