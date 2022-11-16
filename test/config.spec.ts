import {HyperFormula} from '../src'
import {Config} from '../src/Config'
import {enGB, plPL} from '../src/i18n/languages'
import {EmptyValue, NumberType} from '../src/interpreter/InterpreterValue'
import {adr, resetSpy, unregisterAllLanguages} from './testUtils'
import {CellValueNoNumber} from '../src/Cell'

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

  it('should throw error when currency symbol is not a string', () => {
    expect(() => {
      new Config({currencySymbol: [ 42 as unknown as string ]})
    }).toThrowError('Expected value of type: string[] for config parameter: currencySymbol')
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

  describe('#dateFormats', () => {
    it('should use the data formats provided in config param', () => {
      const dateFormats = ['DD/MM/YYYY']
      const engine = HyperFormula.buildFromArray([
        ['1'],
        ['01/03/2022'],
        ['2022/01/01'],
      ], { dateFormats })

      expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(NumberType.NUMBER_RAW)
      expect(engine.getCellValueDetailedType(adr('A2'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueDetailedType(adr('A3'))).toEqual(CellValueNoNumber.STRING)
    })

    it('should parse the dates with different separators', () => {
      const dateFormats = ['DD/MM/YYYY']
      const engine = HyperFormula.buildFromArray([[
        '01/03/2022',
        '01-03-2022',
        '01 03 2022',
        '01.03.2022',
        '01/03-2022',
        '01 03.2022',
        '01 03/2022',
        '01.03-2022',
      ]], { dateFormats })

      expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('A1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('B1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('B1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('C1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('C1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('D1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('D1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('E1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('E1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('F1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('F1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('G1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('G1'))).toEqual('DD/MM/YYYY')
      expect(engine.getCellValueDetailedType(adr('H1'))).toEqual(NumberType.NUMBER_DATE)
      expect(engine.getCellValueFormat(adr('H1'))).toEqual('DD/MM/YYYY')
    })
  })

  describe('#timeFormats', () => {
    it('should work with the "hh:mm" format', () => {
      const timeFormats = ['hh:mm']
      const engine = HyperFormula.buildFromArray([
        ['13.33'],
        ['13:33'],
        ['01:33'],
        ['1:33'],
        ['13:33:33'],
      ], { timeFormats })

      expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(NumberType.NUMBER_RAW)
      expect(engine.getCellValueDetailedType(adr('A2'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A3'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A4'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A5'))).toEqual(CellValueNoNumber.STRING)
    })

    it('should accept "AM/PM" designator', () => {
      const timeFormats = ['hh:mm']
      const engine = HyperFormula.buildFromArray([
        ['1:33 AM'],
        ['1:33 PM'],
        ['01:33 am'],
        ['1:33 pm'],
        ['1:33AM'],
        ['1:33PM'],
        ['1:33          AM'],
        ['1:33          PM'],
        ['13:33 AM'],
      ], { timeFormats })

      expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A2'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A3'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A4'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A5'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A6'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A7'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A8'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A9'))).toEqual(CellValueNoNumber.STRING)
    })

    it('should work with the "hh:mm:ss" format', () => {
      const timeFormats = ['hh:mm:ss']
      const engine = HyperFormula.buildFromArray([
        ['13:33'],
        ['1:33:33'],
        ['1:33:33 AM'],
        ['1:33:33 PM'],
        ['1:33:33 am'],
        ['1:33:33 pm'],
        ['1:33:33 a'],
        ['1:33:33 p'],
        ['1:33:33 A'],
        ['1:33:33 P'],
        ['13:33:33'],
        ['01:33:33'],
        ['1:33:33.3'],
        ['1:33:33.33'],
        ['1:33:33.333'],
        ['1:33:33.3333'],
        ['1:33:33.333333333333333333333333333333333333333333333333333333'],
      ], { timeFormats })

      expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(CellValueNoNumber.STRING)
      expect(engine.getCellValueDetailedType(adr('A2'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A3'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A4'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A5'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A6'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A7'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A8'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A9'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A10'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A11'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A12'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A13'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A14'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A15'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A16'))).toEqual(NumberType.NUMBER_TIME)
      expect(engine.getCellValueDetailedType(adr('A17'))).toEqual(NumberType.NUMBER_TIME)
    })

    it('the parsing result should be the same regardless of decimal places specified in format string', () => {
      const dateAsString = '13:33:33.33333'
      const dateAsNumber = 0.564969131944444

      let engine = HyperFormula.buildFromArray([[dateAsString]], { timeFormats: ['hh:mm:ss'] })
      expect(engine.getCellValue(adr('A1'))).toEqual(dateAsNumber)

      engine = HyperFormula.buildFromArray([[dateAsString]], { timeFormats: ['hh:mm:ss.s'] })
      expect(engine.getCellValue(adr('A1'))).toEqual(dateAsNumber)

      engine = HyperFormula.buildFromArray([[dateAsString]], { timeFormats: ['hh:mm:ss.ss'] })
      expect(engine.getCellValue(adr('A1'))).toEqual(dateAsNumber)

      engine = HyperFormula.buildFromArray([[dateAsString]], { timeFormats: ['hh:mm:ss.sss'] })
      expect(engine.getCellValue(adr('A1'))).toEqual(dateAsNumber)

      engine = HyperFormula.buildFromArray([[dateAsString]], { timeFormats: ['hh:mm:ss.ssss'] })
      expect(engine.getCellValue(adr('A1'))).toEqual(dateAsNumber)

      engine = HyperFormula.buildFromArray([[dateAsString]], { timeFormats: ['hh:mm:ss.sssss'] })
      expect(engine.getCellValue(adr('A1'))).toEqual(dateAsNumber)
    })
  })

  describe('deprecated option warning messages', () => {
    beforeEach(() => {
      spyOn(console, 'warn')
    })

    afterEach(() => {
      resetSpy(console.warn)
    })

    it('should log usage of deprecated options when they are passed while engine initialization', () => {
      new Config({
        binarySearchThreshold: 20,
      })

      expect(console.warn).toHaveBeenCalledWith('binarySearchThreshold option is deprecated since 1.1')
      expect(console.warn).toHaveBeenCalledTimes(1)
    })

    it('should log usage of deprecated options when they are passed while merging the Config object', () => {
      const config = new Config()

      config.mergeConfig({
        binarySearchThreshold: 20
      })

      expect(console.warn).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith('binarySearchThreshold option is deprecated since 1.1')
    })

    it('should not log usage of deprecated options when they are not passed while merging the Config object', () => {
      const config = new Config({
        binarySearchThreshold: 20,
      })
      resetSpy(console.warn)

      config.mergeConfig({})

      expect(console.warn).not.toHaveBeenCalled()
    })
  })
})

describe('getConfig', () => {
  it('should not be an instance of Config', () => {
    const engine = HyperFormula.buildEmpty()
    expect(engine.getConfig()).not.toBeInstanceOf(Config)
  })

  it('should copy returned values', () => {
    const arr = ['mm']
    const engine = HyperFormula.buildEmpty({dateFormats: arr})
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
