import {Config} from '../src/Config'
import {plPL} from '../src/i18n'

describe('Config', () => {
  it('works', () => {
    const config = new Config({language: plPL})

    expect(config.language).toBe(plPL)
  })

  it('has some defaults', () => {
    const config = new Config()

    expect(config.language).toBe(Config.defaultConfig.language)
  })
})
