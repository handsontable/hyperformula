import {HyperFormula} from '../src'
import './testConfig.ts'
import {Config} from '../src/Config'

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine).toBeInstanceOf(HyperFormula)
  })

  it('accepts config params', () => {
    const config = { dateFormats: ['MM'] }
    const engine = HyperFormula.buildEmpty(config)
    expect(engine.getConfig().dateFormats[0]).toBe('MM')
  })
})
