import {Config, HandsOnEngine} from '../src'
import './testConfig.ts'

describe('Building empty engine', () => {
  it('works', () => {
    const engine = HandsOnEngine.buildEmpty()
    expect(engine).toBeInstanceOf(HandsOnEngine)
  })

  it('accepts config', () => {
    const config = new Config()
    const engine = HandsOnEngine.buildEmpty(config)
    expect(engine.config).toBe(config)
  })
})
