import {Config} from '../src'
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

  it('should throw error when there is a conflict between separators', () => {
    expect(() => {
      new Config({ decimalSeparator: ',', functionArgSeparator: ',' })
    }).toThrow('Config initialization failed. Function argument separator and decimal separator needs to differ.')
  })

  it('should throw error when decimal separator is not correct', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      new Config({ decimalSeparator: ';' })
    }).toThrow('Config initialization failed. Decimal separator can take \'.\' or \',\' as a value.')
  })
})
