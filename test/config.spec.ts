import {Config} from '../src/Config'

describe('Config', () => {
  it('works', () => {
    const config = new Config({language: 'PL'})

    expect(config.language).toBe('PL')
  })

  it('has some defaults', () => {
    const config = new Config()

    expect(config.language).toBe(Config.defaultConfig.language)
  })
})
