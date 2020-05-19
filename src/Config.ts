/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType} from './Cell'
import {defaultParseToDateTime} from './DateTimeDefault'
import {DateTime, instanceOfSimpleDate, SimpleDate, SimpleDateTime} from './DateTimeHelper'
import {ExpectedOneOfValues, ExpectedValueOfType, ConfigValueTooSmallError, ConfigValueTooBigError} from './errors'
import {AlwaysDense, ChooseAddressMapping} from './DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {defaultStringifyDateTime} from './format/format'
import {HyperFormula} from './HyperFormula'
import {TranslationPackage} from './i18n'
import {Maybe} from './Maybe'
import {ParserConfig} from './parser/ParserConfig'
import {checkLicenseKeyValidity, LicenseKeyValidityState} from './helpers/licenseKeyValidator'
import {FunctionPluginDefinition} from './interpreter/plugin/FunctionPlugin'

type GPUMode = 'gpu' | 'cpu' | 'dev'

const PossibleGPUModeString: GPUMode[] = ['gpu', 'cpu', 'dev']

export interface ConfigParams {
  /**
   * Specifies if the string comparison is accent sensitive or not.
   * Applies to comparison operators only.
   *
   * @default false
   *
   * @category String
   */
  accentSensitive: boolean,
  /**
   * Specifies if the string comparison is case-sensitive or not.
   * Applies to comparison operators only.
   *
   * @default false
   *
   * @category String
   */
  caseSensitive: boolean,
  /**
   * Allows to define if upper case or lower case should sort first.
   * When set to `false` uses the locale's default.
   *
   * @default 'lower'
   *
   * @category String
   */
  caseFirst: 'upper' | 'lower' | 'false',
  /**
   * Determines which address mapping policy will be used. Built in implementations:
   * - DenseSparseChooseBasedOnThreshold - will choose address mapping for each sheet separately based on fill ratio.
   * - AlwaysDense - will use DenseStrategy for all sheets.
   * - AlwaysSparse - will use SparseStrategy for all sheets.
   *
   * @default AlwaysDense
   */
  chooseAddressMappingPolicy: ChooseAddressMapping,
  /**
   * A list of date formats that are supported by date parsing functions.
   *
   * The separator is ignored and it can be any of '-' (dash), ' ' (empty space), '/' (comma).
   *
   * Any order of YY, MM, DD is accepted as a date, and YY can be replaced with YYYY.
   *
   * @default ['MM/DD/YYYY', 'MM/DD/YY']
   *
   * @category DateTime
   */
  dateFormats: string[],
  /**
   * A list of time formats that are supported by time parsing functions.
   *
   * The separator is ':' (colon).
   *
   * Any configuration of at least two of hh, mm, ss is accepted as a time, and they can be put in any order.
   *
   * @default ['hh:mm', 'hh:mm:ss']
   */
  timeFormats: string[],
  /**
   * A separator character used to separate arguments of procedures in formulas. Must be different from [[decimalSeparator]] and [[thousandSeparator]].
   *
   * @default ','
   *
   * @category Syntax
   */
  functionArgSeparator: string,
  /**
   * A decimal separator used for parsing numeric literals.
   * Can be either '.' (period) or ',' (comma) and must be different from [[thousandSeparator]] and [[functionArgSeparator]].
   *
   * @default '.'
   *
   * @category Number
   */
  decimalSeparator: '.' | ',',
  /**
   * Code for translation package with translations of function and error names.
   *
   * @default 'enGB'
   */
  language: string,
  /**
   * License key for commercial version of HyperFormula.
   *
   * @default ''
   */
  licenseKey: string,
  /**
   * A thousand separator used for parsing numeric literals.
   * Can be either empty, ',' (comma) or ' ' (empty space) and must be different from [[decimalSeparator]] and [[functionArgSeparator]].
   *
   * @default ''
   *
   * @category Number
   */
  thousandSeparator: '' | ',' | ' ' | '.',
  /**
   * A list of additional function plugins to use by formula interpreter.
   *
   * @default []
   *
   * @category Syntax
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionPlugins: any[],
  /**
   * Allows to set GPU or CPU for use in matrix calculations.
   * When set to 'gpu' it will try to use GPU for matrix calculations. Setting it to 'cpu' will force CPU usage.
   * Other values should be used for debugging purposes only. More info can be found in GPU.js documentation.
   *
   * @default 'gpu'
   *
   * @category Engine
   */
  gpuMode: GPUMode,
  /**
   * Specifies whether punctuation should be ignored in string comparison.
   *
   * @default false
   *
   * @category String
   */
  ignorePunctuation: boolean,
  /**
   * Preserves an option for setting 1900 as a leap year.
   * 1900 was not a leap year, but in Lotus 1-2-3 it was faulty interpreted as a leap year.
   * Set to `true` for compatibility with Lotus 1-2-3 and Excel. See [[nullDate]] for complete solution.
   *
   * @default false
   *
   * @category DateTime
   */
  leapYear1900: boolean,
  /**
   * Sets the locale using a BCP 47 code language tag for language sensitive string comparison.
   *
   * @default 'en'
   *
   * @category String
   */
  localeLang: string,
  /**
   * Enables numeric matrix detection feature when set to 'true'.
   * During build phase each rectangular area of numbers will be treated as one matrix vertex in order to optimize further calculations.
   * Some CRUD operations may break numeric matrices into individual vertices if needed.
   *
   * @default true
   *
   * @category Engine
   */
  matrixDetection: boolean,
  /**
   * Specifies how many cells an area must have in order to be treated as a matrix. Relevant only if [[matrixDetection]] is set to `true`.
   *
   * @default 100
   *
   * @category Engine
   */
  matrixDetectionThreshold: number,
  /**
   * Two-digit values when interpreted as a year can be either 19xx or 20xx.
   * If `xx <= nullYear` its latter, otherwise its former.
   *
   * @default 30
   *
   * @category DateTime
   */
  nullYear: number,
  /**
   * Allows to provide a function that takes a string representing date-time and parses it into an actual date-time.
   *
   * @default defaultParseToDateTime
   *
   * @category DateTime
   */
  parseDateTime: (dateTimeString: string, dateFormat: string, timeFormat: string) => Maybe<DateTime>,
  /**
   * Controls how far two numerical values need to be from each other to be treated as non-equal.
   * `a` and `b` are equal if they are of the same sign and:
   * `abs(a) <= (1+precisionEpsilon) * abs(b)`
   * and
   * `abs(b) <= (1+precisionEpsilon) * abs(a)`.
   * It also controls snap-to-zero behavior for additions/subtractions:
   * for `c=a+b` or `c=a-b`, if `abs(c) <= precisionEpsilon * abs(a)`, then `c` is set to `0`
   *
   * @default 1e-13
   *
   * @category Number
   */
  precisionEpsilon: number,
  /**
   * Sets how precise the calculation should be.
   * Numerical outputs are rounded to `precisionRounding` many digits after the decimal.
   *
   * @default 14
   *
   * @category Number
   */
  precisionRounding: number,
  /**
   * Allows to provide a function that takes date and prints it into string.
   *
   * @default defaultStringifyDateTime
   *
   * @category DateTime
   */
  stringifyDateTime: (dateTime: SimpleDateTime, dateFormat: string) => Maybe<string>,
  /**
   * Sets the rounding.
   * If `false`, no rounding happens, and numbers are equal if and only if they are truly identical value (see: [[precisionEpsilon]]).
   *
   * @default true
   *
   * @category Number
   */
  smartRounding: boolean,
  /**
   * Switches column search strategy from binary search to column index.
   * Used by VLOOKUP and MATCH functions.
   * Using column index may improve time efficiency but it will increase memory usage.
   * In some scenarios column index may fall back to binary search despite this flag.
   *
   * @default false
   *
   * @category Engine
   */
  useColumnIndex: boolean,
  /**
   * Enables gathering engine statistics and timings. Useful for testing and benchmarking.
   *
   * @default false
   *
   * @category Engine
   */
  useStats: boolean,
  /**
   * Determines minimum number of elements a range must have in order to use binary search.
   * Shorter ranges will be searched naively.
   * Used by VLOOKUP and MATCH functions.
   *
   * @default 20
   *
   * @category Engine
   */
  vlookupThreshold: number,
  /**
   * Allows to set a specific date from which the number of days will be counted.
   * Dates are represented internally as a number of days that passed since this `nullDate`.
   *
   * @default {year: 1899, month: 12, day: 30}
   *
   * @category DateTime
   */
  nullDate: SimpleDate,
  /**
   * A number of kept elements in undo history.
   *
   * @default 20
   *
   * @category UndoRedo
   */
  undoLimit: number,
  /**
   * Maximum number of rows
   *
   * @default 40,000
   *
   * @category Engine
   * */
  maxRows: number,
  /**
   * Maximum number of columns
   *
   * @default 18,278
   *
   * @category Engine
   * */
  maxColumns: number,
}

type ConfigParamsList = keyof ConfigParams

export class Config implements ConfigParams, ParserConfig {

  public static defaultConfig: ConfigParams = {
    accentSensitive: false,
    caseSensitive: false,
    caseFirst: 'lower',
    ignorePunctuation: false,
    chooseAddressMappingPolicy: new AlwaysDense(),
    dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
    timeFormats: ['hh:mm', 'hh:mm:ss'],
    functionArgSeparator: ',',
    decimalSeparator: '.',
    thousandSeparator: '',
    language: 'enGB',
    licenseKey: '',
    functionPlugins: [],
    gpuMode: 'gpu',
    leapYear1900: false,
    smartRounding: true,
    localeLang: 'en',
    matrixDetection: true,
    matrixDetectionThreshold: 100,
    nullYear: 30,
    parseDateTime: defaultParseToDateTime,
    stringifyDateTime: defaultStringifyDateTime,
    precisionEpsilon: 1e-13,
    precisionRounding: 14,
    useColumnIndex: false,
    useStats: false,
    vlookupThreshold: 20,
    nullDate: {year: 1899, month: 12, day: 30},
    undoLimit: 20,
    maxRows: 40_000,
    maxColumns: 18_278
  }

  /** @inheritDoc */
  public readonly caseSensitive: boolean
  /** @inheritDoc */
  public readonly chooseAddressMappingPolicy: ChooseAddressMapping
  /** @inheritDoc */
  public readonly accentSensitive: boolean
  /** @inheritDoc */
  public readonly caseFirst: 'upper' | 'lower' | 'false'
  /** @inheritDoc */
  public readonly dateFormats: string[]
  /** @inheritDoc */
  public readonly timeFormats: string[]
  /** @inheritDoc */
  public readonly functionArgSeparator: string
  /** @inheritDoc */
  public readonly decimalSeparator: '.' | ','
  /** @inheritDoc */
  public readonly thousandSeparator: '' | ',' | ' ' | '.'
  /** @inheritDoc */
  public readonly language: string
  /** @inheritDoc */
  public readonly licenseKey: string
  /** @inheritDoc */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly functionPlugins: FunctionPluginDefinition[]
  /** @inheritDoc */
  public readonly gpuMode: GPUMode
  /** @inheritDoc */
  public readonly leapYear1900: boolean
  /** @inheritDoc */
  public readonly matrixDetection: boolean
  /** @inheritDoc */
  public readonly ignorePunctuation: boolean
  /** @inheritDoc */
  public readonly localeLang: string
  /** @inheritDoc */
  public readonly matrixDetectionThreshold: number
  /** @inheritDoc */
  public readonly nullYear: number
  /** @inheritDoc */
  public readonly parseDateTime: (dateString: string, dateFormats: string) => Maybe<SimpleDateTime>
  /** @inheritDoc */
  public readonly stringifyDateTime: (date: SimpleDateTime, formatArg: string) => Maybe<string>
  /** @inheritDoc */
  public readonly precisionEpsilon: number
  /** @inheritDoc */
  public readonly precisionRounding: number
  /** @inheritDoc */
  public readonly smartRounding: boolean
  /** @inheritDoc */
  public readonly useColumnIndex: boolean
  /** @inheritDoc */
  public readonly useStats: boolean
  /** @inheritDoc */
  public readonly vlookupThreshold: number
  /** @inheritDoc */
  public readonly nullDate: SimpleDate
  /** @inheritDoc */
  public readonly undoLimit: number
  /**
   * Built automatically based on translation package.
   *
   * @internal
   */
  public readonly errorMapping: Record<string, ErrorType>
  /** @inheritDoc */
  public readonly maxRows: number
  /** @inheritDoc */
  public readonly maxColumns: number
  /**
   * Built automatically based on language.
   *
   * @internal
   */
  public readonly translationPackage: TranslationPackage
  /**
   * Set automatically based on licenseKey checking result.
   *
   * @internal
   */
  #licenseKeyValidityState: LicenseKeyValidityState
  /**
   * Proxied property to its private counterpart. This makes the property
   * as accessible as the other Config options but without ability to change the value.
   *
   * @internal
   */
  public get licenseKeyValidityState() {
    return this.#licenseKeyValidityState
  }

  constructor(
    {
      accentSensitive,
      caseSensitive,
      caseFirst,
      chooseAddressMappingPolicy,
      dateFormats,
      timeFormats,
      functionArgSeparator,
      decimalSeparator,
      thousandSeparator,
      language,
      licenseKey,
      functionPlugins,
      gpuMode,
      ignorePunctuation,
      leapYear1900,
      localeLang,
      smartRounding,
      matrixDetection,
      matrixDetectionThreshold,
      nullYear,
      parseDateTime,
      stringifyDateTime,
      precisionEpsilon,
      precisionRounding,
      useColumnIndex,
      vlookupThreshold,
      nullDate,
      useStats,
      undoLimit,
      maxRows,
      maxColumns
    }: Partial<ConfigParams> = {},
  ) {
    this.accentSensitive = this.valueFromParam(accentSensitive, 'boolean', 'accentSensitive')
    this.caseSensitive = this.valueFromParam(caseSensitive, 'boolean', 'caseSensitive')
    this.caseFirst = this.valueFromParam(caseFirst, ['upper', 'lower', 'false'], 'caseFirst')
    this.ignorePunctuation = this.valueFromParam(ignorePunctuation, 'boolean', 'ignorePunctuation')
    this.chooseAddressMappingPolicy = chooseAddressMappingPolicy ?? Config.defaultConfig.chooseAddressMappingPolicy
    this.dateFormats = this.valueFromParamCheck(dateFormats, Array.isArray, 'array', 'dateFormats')
    this.timeFormats = this.valueFromParamCheck(timeFormats, Array.isArray, 'array', 'timeFormats')
    this.functionArgSeparator = this.valueFromParam(functionArgSeparator, 'string', 'functionArgSeparator')
    this.decimalSeparator = this.valueFromParam(decimalSeparator, ['.', ','], 'decimalSeparator')
    this.language = this.valueFromParam(language, 'string', 'language')
    this.licenseKey = this.valueFromParam(licenseKey, 'string', 'licenseKey')
    this.#licenseKeyValidityState = checkLicenseKeyValidity(this.licenseKey)
    this.thousandSeparator = this.valueFromParam(thousandSeparator, ['', ',', ' ', '.'], 'thousandSeparator')
    this.localeLang = this.valueFromParam(localeLang, 'string', 'localeLang')
    this.functionPlugins = functionPlugins ?? Config.defaultConfig.functionPlugins
    this.gpuMode = this.valueFromParam(gpuMode, PossibleGPUModeString, 'gpuMode')
    this.smartRounding = this.valueFromParam(smartRounding, 'boolean', 'smartRounding')
    this.matrixDetection = this.valueFromParam(matrixDetection, 'boolean', 'matrixDetection')
    this.matrixDetectionThreshold = this.valueFromParam(matrixDetectionThreshold, 'number', 'matrixDetectionThreshold')
    this.validateNumberToBeAtLeast(this.matrixDetectionThreshold, 'matrixDetectionThreshold', 1)
    this.nullYear = this.valueFromParam(nullYear, 'number', 'nullYear')
    this.validateNumberToBeAtLeast(this.nullYear, 'nullYear', 0)
    this.validateNumberToBeAtMost(this.nullYear, 'nullYear', 100)
    this.precisionRounding = this.valueFromParam(precisionRounding, 'number', 'precisionRounding')
    this.validateNumberToBeAtLeast(this.precisionRounding, 'precisionRounding', 0)
    this.precisionEpsilon = this.valueFromParam(precisionEpsilon, 'number', 'precisionEpsilon')
    this.validateNumberToBeAtLeast(this.precisionEpsilon, 'precisionEpsilon', 0)
    this.useColumnIndex = this.valueFromParam(useColumnIndex, 'boolean', 'useColumnIndex')
    this.useStats = this.valueFromParam(useStats, 'boolean', 'useStats')
    this.vlookupThreshold = this.valueFromParam(vlookupThreshold, 'number', 'vlookupThreshold')
    this.validateNumberToBeAtLeast(this.vlookupThreshold, 'vlookupThreshold', 1)
    this.parseDateTime = this.valueFromParam(parseDateTime, 'function', 'parseDateTime')
    this.stringifyDateTime = this.valueFromParam(stringifyDateTime, 'function', 'stringifyDateTime')
    this.translationPackage = HyperFormula.getLanguage(this.language)
    this.errorMapping = this.translationPackage.buildErrorMapping()
    this.nullDate = this.valueFromParamCheck(nullDate, instanceOfSimpleDate, 'IDate', 'nullDate')
    this.leapYear1900 = this.valueFromParam(leapYear1900, 'boolean', 'leapYear1900')
    this.undoLimit = this.valueFromParam(undoLimit, 'number', 'undoLimit')
    this.validateNumberToBeAtLeast(this.undoLimit, 'undoLimit', 0)
    this.maxRows = this.valueFromParam(maxRows, 'number', 'maxRows')
    this.validateNumberToBeAtLeast(this.maxRows, 'maxRows', 1)
    this.maxColumns = this.valueFromParam(maxColumns, 'number', 'maxColumns')
    this.validateNumberToBeAtLeast(this.maxColumns, 'maxColumns', 1)


    this.checkIfParametersNotInConflict(
      {value: this.decimalSeparator, name: 'decimalSeparator'},
      {value: this.functionArgSeparator, name: 'functionArgSeparator'},
      {value: this.thousandSeparator, name: 'thousandSeparator'}
    )
  }

  public getConfig(): ConfigParams { //TODO: avoid pollution
    return this
  }

  public mergeConfig(init: Partial<ConfigParams>): Config {
    const mergedConfig: ConfigParams = Object.assign({}, this.getConfig(), init)

    return new Config(mergedConfig)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private valueFromParam(inputValue: any, expectedType: string | string[], paramName: ConfigParamsList) {
    if (typeof inputValue === 'undefined') {
      return Config.defaultConfig[paramName]
    } else if (typeof expectedType === 'string') {
      if (typeof inputValue === expectedType) {
        return inputValue
      } else {
        throw new ExpectedValueOfType(expectedType, paramName)
      }
    } else {
      if (expectedType.includes(inputValue)) {
        return inputValue
      } else {
        throw new ExpectedOneOfValues(expectedType.map((val: string) => '\'' + val + '\'').join(' '), paramName)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private valueFromParamCheck(inputValue: any, typeCheck: (object: any) => boolean, expectedType: string, paramName: ConfigParamsList) {
    if (typeCheck(inputValue)) {
      return inputValue
    } else if (typeof inputValue === 'undefined') {
      return Config.defaultConfig[paramName]
    } else {
      throw new ExpectedValueOfType(expectedType, paramName)
    }
  }

  private checkIfParametersNotInConflict(...params: { value: number | string | boolean, name: string }[]) {
    const valuesMap: Map<number | string | boolean, string[]> = new Map()

    params.forEach((param) => {
      const names = valuesMap.get(param.value) || []
      names.push(param.name)
      valuesMap.set(param.value, names)
    })

    const duplicates: string[][] = []
    for (const entry of valuesMap.values()) {
      if (entry.length > 1) {
        duplicates.push(entry)
      }
    }

    if (duplicates.length > 0) {
      const paramNames = duplicates.map(entry => `[${entry.sort()}]`).join('; ')
      throw new Error(`Config initialization failed. Parameters in conflict: ${paramNames}`)
    }
  }

  private validateNumberToBeAtLeast(value: number, paramName: string, minimum: number) {
    if (value < minimum) {
      throw new ConfigValueTooSmallError(paramName, minimum)
    }
  }

  private validateNumberToBeAtMost(value: number, paramName: string, maximum: number) {
    if (value > maximum) {
      throw new ConfigValueTooBigError(paramName, maximum)
    }
  }
}
