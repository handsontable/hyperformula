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

  it( 'validation: boolean params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({caseSensitive: 'abcd'})).toThrow('Expected value of type: boolean for config parameter: caseSensitive')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => new Config({smartRounding: []})).toThrow('Expected value of type: boolean for config parameter: smartRounding')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => new Config({matrixDetection: 0})).toThrow('Expected value of type: boolean for config parameter: matrixDetection')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => new Config({useColumnIndex: Symbol()})).toThrow('Expected value of type: boolean for config parameter: useColumnIndex')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => new Config({leapYear1900: () => 1})).toThrow('Expected value of type: boolean for config parameter: leapYear1900')
  })

  it( 'validation: number params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({matrixDetectionThreshold: 'abcd'})).toThrow('Expected value of type: number for config parameter: matrixDetectionThreshold')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({nullYear: true})).toThrow('Expected value of type: number for config parameter: nullYear')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({precisionRounding: /abcd/})).toThrow('Expected value of type: number for config parameter: precisionRounding')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({precisionEpsilon: {}})).toThrow('Expected value of type: number for config parameter: precisionEpsilon')
  })

  it( 'validation: string params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({functionArgSeparator: 123})).toThrow('Expected value of type: string for config parameter: functionArgSeparator')
  })

  it( 'validation: function params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({parseDate: true})).toThrow('Expected value of type: function for config parameter: parseDate')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({stringifyDate: 1})).toThrow('Expected value of type: function for config parameter: stringifyDate')
  })

  it( 'validation: other params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({nullDate: { year: 123, month: 123, day: true }
    })).toThrow('Expected value of type: IDate for config parameter: nullDate')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({dateFormats: {}})).toThrow('Expected value of type: array for config parameter: dateFormats')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({gpuMode: 'abcd'})).toThrow('Expected: \'gpu\', \'cpu\', \'dev\' for config parameter: gpuMode')
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
    }).toThrow('Expected: \'.\', \',\' for config parameter: decimalSeparator')
  })
})
