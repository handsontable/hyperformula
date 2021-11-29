import {HyperFormula} from '../src'
import {Config} from '../src/Config'
import {enGB, plPL} from '../src/i18n/languages'
import {EmptyValue} from '../src/interpreter/InterpreterValue'
import {unregisterAllLanguages} from './testUtils'

describe('Config', () => {
  beforeEach(() => {
    unregisterAllLanguages()
    HyperFormula.registerLanguage(plPL.langCode, plPL)
    HyperFormula.registerLanguage(enGB.langCode, enGB)
  })

  it('works', () => {
    const config = new Config({language: 'plPL'})

    expect(config.language).toBe('plPL')
  })

  it('has some defaults', () => {
    const config = new Config()

    expect(config.language).toBe(Config.defaultConfig.language)
  })

  it('can translate functions', () => {
    const config = new Config({language: 'plPL'})

    expect(config.translationPackage.getFunctionTranslation('SUM')).toEqual('SUMA')
  })

  it('validation: boolean params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({ignorePunctuation: 1})).toThrowError('Expected value of type: boolean for config parameter: ignorePunctuation')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({accentSensitive: 'abcd'})).toThrowError('Expected value of type: boolean for config parameter: accentSensitive')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({caseSensitive: 'abcd'})).toThrowError('Expected value of type: boolean for config parameter: caseSensitive')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({smartRounding: []})).toThrowError('Expected value of type: boolean for config parameter: smartRounding')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({useColumnIndex: Symbol()})).toThrowError('Expected value of type: boolean for config parameter: useColumnIndex')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({leapYear1900: () => 1})).toThrowError('Expected value of type: boolean for config parameter: leapYear1900')
  })

  it('validation: number params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({nullYear: true})).toThrowError('Expected value of type: number for config parameter: nullYear')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({precisionRounding: /abcd/})).toThrowError('Expected value of type: number for config parameter: precisionRounding')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({precisionEpsilon: {}})).toThrowError('Expected value of type: number for config parameter: precisionEpsilon')
  })

  it('validation: string params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({functionArgSeparator: 123})).toThrowError('Expected value of type: string for config parameter: functionArgSeparator')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({localeLang: EmptyValue})).toThrowError('Expected value of type: string for config parameter: localeLang')
  })

  it('validation: function params', () => {
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({parseDateTime: true})).toThrowError('Expected value of type: function for config parameter: parseDateTime')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({stringifyDateTime: 1})).toThrowError('Expected value of type: function for config parameter: stringifyDateTime')
  })

  it('validation: other params', () => {
    expect(() => new Config({
      // eslint-disable-next-line
      // @ts-ignore
      nullDate: {year: 123, month: 123, day: true}
    })).toThrowError('Expected value of type: IDate for config parameter: nullDate')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({dateFormats: {}})).toThrowError('Expected value of type: array for config parameter: dateFormats')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({gpuMode: 'abcd'})).toThrowError('Expected one of \'gpu\' \'cpu\' \'dev\' for config parameter: gpuMode')
    // eslint-disable-next-line
    // @ts-ignore
    expect(() => new Config({caseFirst: 'abcd'})).toThrowError('Expected one of \'upper\' \'lower\' \'false\' for config parameter: caseFirst')
  })

  it('should throw error when there is a conflict between separators', () => {
    expect(() => {
      new Config({decimalSeparator: ',', functionArgSeparator: ',', thousandSeparator: ' '})
    }).toThrowError('Config initialization failed. Parameters in conflict: [decimalSeparator,functionArgSeparator]')
    expect(() => {
      new Config({decimalSeparator: ',', functionArgSeparator: ';', thousandSeparator: ','})
    }).toThrowError('Config initialization failed. Parameters in conflict: [decimalSeparator,thousandSeparator]')
    expect(() => {
      new Config({decimalSeparator: '.', functionArgSeparator: ',', thousandSeparator: ','})
    }).toThrowError('Config initialization failed. Parameters in conflict: [functionArgSeparator,thousandSeparator]')
    expect(() => {
      new Config({decimalSeparator: ',', functionArgSeparator: ',', thousandSeparator: ','})
    }).toThrowError('Config initialization failed. Parameters in conflict: [decimalSeparator,functionArgSeparator,thousandSeparator]')
    expect(() => {
      new Config({arrayColumnSeparator: ';', arrayRowSeparator: ';'})
    }).toThrowError('Config initialization failed. Parameters in conflict: [arrayColumnSeparator,arrayRowSeparator]')
  })

  it('should throw error when currency symbol is empty', () => {
    expect(() => {
      new Config({currencySymbol: ['']})
    }).toThrowError('Config parameter currencySymbol cannot be empty.')
  })

  it('should throw error when currency symbol is not an array', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      new Config({currencySymbol: '$'})
    }).toThrowError('Expected value of type: array for config parameter: currencySymbol')
  })

  it('should throw error when decimal separator is not correct', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      new Config({decimalSeparator: ';'})
    }).toThrowError('Expected one of \'.\' \',\' for config parameter: decimalSeparator')
  })

  it('should throw error when thousand separator is not correct', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      new Config({thousandSeparator: ';'})
    }).toThrowError('Expected one of \'\' \',\' \' \' \'.\' for config parameter: thousandSeparator')
  })

  it('should throw error when matrix row separator is not correct', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      new Config({arrayRowSeparator: ','})
    }).toThrowError('Expected one of \';\' \'|\' for config parameter: arrayRowSeparator')
  })

  it('should throw error when matrix columns separator is not correct', () => {
    expect(() => {
      // eslint-disable-next-line
      // @ts-ignore
      new Config({arrayColumnSeparator: '|'})
    }).toThrowError('Expected one of \',\' \';\' for config parameter: arrayColumnSeparator')
  })

  it('#undoLimit validation', () => {
    expect(() => new Config({undoLimit: 0})).not.toThrowError()
    expect(() => new Config({undoLimit: 42})).not.toThrowError()
    expect(() => new Config({undoLimit: Infinity})).not.toThrowError()
    expect(() => new Config({undoLimit: -1})).toThrowError('Config parameter undoLimit should be at least 0')
  })

  it('#precisionEpsilon', () => {
    expect(() => new Config({precisionEpsilon: 0})).not.toThrowError()
    expect(() => new Config({precisionEpsilon: 42})).not.toThrowError()
    expect(() => new Config({precisionEpsilon: Infinity})).not.toThrowError()
    expect(() => new Config({precisionEpsilon: -1})).toThrowError('Config parameter precisionEpsilon should be at least 0')
  })

  it('#precisionRounding', () => {
    expect(() => new Config({precisionRounding: 0})).not.toThrowError()
    expect(() => new Config({precisionRounding: 42})).not.toThrowError()
    expect(() => new Config({precisionRounding: Infinity})).not.toThrowError()
    expect(() => new Config({precisionRounding: -1})).toThrowError('Config parameter precisionRounding should be at least 0')
  })

  it('#maxRows', () => {
    expect(() => new Config({maxRows: 1})).not.toThrowError()
    expect(() => new Config({maxRows: 42})).not.toThrowError()
    expect(() => new Config({maxRows: Infinity})).not.toThrowError()
    expect(() => new Config({maxRows: 0})).toThrowError('Config parameter maxRows should be at least 1')
  })

  it('#maxColumns', () => {
    expect(() => new Config({maxColumns: 1})).not.toThrowError()
    expect(() => new Config({maxColumns: 42})).not.toThrowError()
    expect(() => new Config({maxColumns: Infinity})).not.toThrowError()
    expect(() => new Config({maxColumns: 0})).toThrowError('Config parameter maxColumns should be at least 1')
  })

  it('#nullYear', () => {
    expect(() => new Config({nullYear: -1})).toThrowError('Config parameter nullYear should be at least 0')
    expect(() => new Config({nullYear: 0})).not.toThrowError()
    expect(() => new Config({nullYear: 42})).not.toThrowError()
    expect(() => new Config({nullYear: 100})).not.toThrowError()
    expect(() => new Config({nullYear: 101})).toThrowError('Config parameter nullYear should be at most 100')
  })
})

describe('getConfig', () => {
  it('should not be an instance of Config', () => {
    const [engine] = HyperFormula.buildEmpty()
    expect(engine.getConfig()).not.toBeInstanceOf(Config)
  })

  it('should copy returned values', () => {
    const arr = ['mm']
    const [engine] = HyperFormula.buildEmpty({dateFormats: arr})
    const arr2 = engine.getConfig().dateFormats
    expect(arr).toEqual(arr2)
    expect(arr).not.toBe(arr2)
  })
})

describe('getDefaultConfig', () => {
  it('should not be an instance of Config', () => {
    expect(HyperFormula.defaultConfig).not.toBeInstanceOf(Config)
  })

  it('should copy returned values', () => {
    const defaultConfig = HyperFormula.defaultConfig
    defaultConfig.dateFormats.push('mm')
    const defaultDateFormats = HyperFormula.defaultConfig.dateFormats
    expect(defaultDateFormats).toEqual(['DD/MM/YYYY', 'DD/MM/YY'])
  })
})
