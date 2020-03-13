import {buildConfig, Config, EmptyValue} from '../src'
import {plPL} from '../src/i18n'

describe('Config', () => {
  it('works', () => {
    const config = buildConfig({language: plPL})

    expect(config.language).toBe(plPL)
  })

  it('has some defaults', () => {
    const config = buildConfig()

    expect(config.language).toBe(Config.defaultConfig.language)
  })

  it('computes list of volatile functions according to translation', () => {
    const config = buildConfig({ language: plPL })

    expect(config.volatileFunctions()).toContain('LOSUJ')
  })

  it('can translate functions', () => {
    const config = buildConfig({ language: plPL })

    expect(config.getFunctionTranslationFor('SUM')).toEqual('SUMA')
  })

  it( 'validation: boolean params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => buildConfig({ignorePunctuation: 1})).toThrow('Expected value of type: boolean for config parameter: ignorePunctuation')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({accentSensitive: 'abcd'})).toThrow('Expected value of type: boolean for config parameter: accentSensitive')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({caseSensitive: 'abcd'})).toThrow('Expected value of type: boolean for config parameter: caseSensitive')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => buildConfig({smartRounding: []})).toThrow('Expected value of type: boolean for config parameter: smartRounding')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => buildConfig({matrixDetection: 0})).toThrow('Expected value of type: boolean for config parameter: matrixDetection')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => buildConfig({useColumnIndex: Symbol()})).toThrow('Expected value of type: boolean for config parameter: useColumnIndex')
    // eslint-disable-next-line
    // @ts-ignore
    expect( () => buildConfig({leapYear1900: () => 1})).toThrow('Expected value of type: boolean for config parameter: leapYear1900')
  })

  it( 'validation: number params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({matrixDetectionThreshold: 'abcd'})).toThrow('Expected value of type: number for config parameter: matrixDetectionThreshold')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({nullYear: true})).toThrow('Expected value of type: number for config parameter: nullYear')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({precisionRounding: /abcd/})).toThrow('Expected value of type: number for config parameter: precisionRounding')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({precisionEpsilon: {}})).toThrow('Expected value of type: number for config parameter: precisionEpsilon')
  })

  it( 'validation: string params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({functionArgSeparator: 123})).toThrow('Expected value of type: string for config parameter: functionArgSeparator')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({localeLang: EmptyValue})).toThrow('Expected value of type: string for config parameter: localeLang')
  })

  it( 'validation: function params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({parseDate: true})).toThrow('Expected value of type: function for config parameter: parseDate')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({stringifyDate: 1})).toThrow('Expected value of type: function for config parameter: stringifyDate')
  })

  it( 'validation: other params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({nullDate: { year: 123, month: 123, day: true }
    })).toThrow('Expected value of type: IDate for config parameter: nullDate')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({dateFormats: {}})).toThrow('Expected value of type: array for config parameter: dateFormats')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({gpuMode: 'abcd'})).toThrow('Expected one of \'gpu\' \'cpu\' \'dev\' for config parameter: gpuMode')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => buildConfig({caseFirst: 'abcd'})).toThrow('Expected one of \'upper\' \'lower\' \'false\' for config parameter: caseFirst')
  })

  it('should throw error when there is a conflict between separators', () => {
    expect(() => {
      buildConfig({ decimalSeparator: ',', functionArgSeparator: ',' })
    }).toThrow('Config initialization failed. Function argument separator and decimal separator needs to differ.')
  })

  it('should throw error when decimal separator is not correct', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      buildConfig({ decimalSeparator: ';' })
    }).toThrow('Expected one of \'.\' \',\' for config parameter: decimalSeparator')
  })
})
