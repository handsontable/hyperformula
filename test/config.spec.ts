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

  it('computes list of volatile functions according to translation', () => {
    const config = new Config({ language: plPL })

    expect(config.volatileFunctions()).toContain('LOSUJ')
  })

  it('can translate functions', () => {
    const config = new Config({ language: plPL })

    expect(config.getFunctionTranslationFor('SUM')).toEqual('SUMA')
  })
})
