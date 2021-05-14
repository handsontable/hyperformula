/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {GPU} from 'gpu.js'
import {
  configCheckIfParametersNotInConflict,
  configValueFromParam,
  configValueFromParamCheck,
  validateNumberToBeAtLeast,
  validateNumberToBeAtMost
} from './ArgumentSanitization'
import {TranslatableErrorType} from './Cell'
import {defaultParseToDateTime} from './DateTimeDefault'
import {DateTime, instanceOfSimpleDate, SimpleDate, SimpleDateTime, SimpleTime} from './DateTimeHelper'
import {AlwaysDense, ChooseAddressMapping} from './DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {ConfigValueEmpty, ExpectedValueOfTypeError} from './errors'
import {defaultStringifyDateTime, defaultStringifyDuration} from './format/format'
import {checkLicenseKeyValidity, LicenseKeyValidityState} from './helpers/licenseKeyValidator'
import {HyperFormula} from './HyperFormula'
import {TranslationPackage} from './i18n'
import {FunctionPluginDefinition} from './interpreter'
import {Maybe} from './Maybe'
import {ParserConfig} from './parser/ParserConfig'

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
   * Determines minimum number of elements a range must have in order to use binary search.
   * Shorter ranges will be searched naively.
   * Used by VLOOKUP, HLOOKUP and MATCH functions.
   *
   * @default 20
   *
   * @category Engine
   */
  binarySearchThreshold: number,
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
   *
   * @category Engine
   */
  chooseAddressMappingPolicy: ChooseAddressMapping,
  /**
   * Symbols used to denote currency numbers.
   *
   * @default ['$']
   *
   * @category Number
   */
  currencySymbol: string[],
  /**
   * A list of date formats that are supported by date parsing functions.
   *
   * The separator is ignored and it can be any of '-' (dash), ' ' (empty space), '/' (slash).
   *
   * Any order of YY, MM, DD is accepted as a date, and YY can be replaced with YYYY.
   *
   * @default ['MM/DD/YYYY', 'MM/DD/YY']
   *
   * @category Date and Time
   */
  dateFormats: string[],
  /**
   * A separator character used to separate arguments of procedures in formulas. Must be different from [[decimalSeparator]] and [[thousandSeparator]].
   *
   * @default ','
   *
   * @category Formula Syntax
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
   * Sets the compatibility mode for behaviour of null value.
   * If set, formula evaluating to null evaluates to 0 instead.
   *
   * @default false
   *
   * @category Engine
   */
  evaluateNullToZero: boolean,
  /**
   * A list of additional function plugins to use by formula interpreter.
   *
   * @default []
   *
   * @category Formula Syntax
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionPlugins: any[],
  /**
   * A GPU.js constructor used by matrix functions. When not provided, plain cpu implementation will be used.
   *
   * @default undefined
   *
   * @category Engine
   */
  gpujs?: typeof GPU,
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
   * Code for translation package with translations of function and error names.
   *
   * @default 'enGB'
   *
   * @category Formula Syntax
   */
  language: string,
  /**
   * Preserves an option for setting 1900 as a leap year.
   * 1900 was not a leap year, but in Lotus 1-2-3 it was faulty interpreted as a leap year.
   * Set to `true` for compatibility with Lotus 1-2-3 and Excel. See [[nullDate]] for complete solution.
   *
   * @default false
   *
   * @category Date and Time
   */
  leapYear1900: boolean,
  /**
   * A license key of HyperFormula accepts the following values:
   * * `agpl-v3` string if you want to use the software on AGPL v3 license terms,
   * * `non-commercial-and-evaluation` string if you want to use our limited versions,
   * * a valid license key string, if you bought the commercial license.
   *
   * For more details visit [this guide](/guide/license-key.html)
   *
   * @default undefined
   *
   * @category License
   */
  licenseKey: string,
  /**
   * Sets the locale using a BCP 47 code language tag for language sensitive string comparison.
   *
   * @default 'en'
   *
   * @category String
   */
  localeLang: string,
  /**
   * Whether criterions in functions require whole cell to match the pattern, or just a subword.
   *
   * @default true
   * @category String
   */
  matchWholeCell: boolean,
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
  /**
   * Allows to set a specific date from which the number of days will be counted.
   * Dates are represented internally as a number of days that passed since this `nullDate`.
   *
   * @default {year: 1899, month: 12, day: 30}
   *
   * @category Date and Time
   */
  nullDate: SimpleDate,
  /**
   * Two-digit values when interpreted as a year can be either 19xx or 20xx.
   * If `xx <= nullYear` its latter, otherwise its former.
   *
   * @default 30
   *
   * @category Date and Time
   */
  nullYear: number,
  /**
   * Allows to provide a function that takes a string representing date-time and parses it into an actual date-time.
   *
   * @default defaultParseToDateTime
   *
   * @category Date and Time
   */
  parseDateTime: (dateTimeString: string, dateFormat: Maybe<string>, timeFormat: Maybe<string>) => Maybe<DateTime>,
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
   * @category Date and Time
   */
  stringifyDateTime: (dateTime: SimpleDateTime, dateTimeFormat: string) => Maybe<string>,
  /**
   * Allows to provide a function that takes time duration prints it into string.
   *
   * @default defaultStringifyDuration
   *
   * @category Date and Time
   */
  stringifyDuration: (time: SimpleTime, timeFormat: string) => Maybe<string>,
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
   * A thousand separator used for parsing numeric literals.
   * Can be either empty, ',' (comma) or ' ' (empty space) and must be different from [[decimalSeparator]] and [[functionArgSeparator]].
   *
   * @default ''
   *
   * @category Number
   */
  thousandSeparator: '' | ',' | ' ' | '.',
  /**
   * A list of time formats that are supported by time parsing functions.
   *
   * The separator is ':' (colon).
   *
   * Any configuration of at least two of hh, mm, ss is accepted as a time, and they can be put in any order.
   *
   * @default ['hh:mm', 'hh:mm:ss.sss']
   *
   * @category Date and Time
   */
  timeFormats: string[],
  /**
   * Specifies if the array arithmetic operations are allowed globally, or only inside special function (like ARRAYFORMULA).
   *
   * @default false
   *
   * @category Engine
   */
  useArrayArithmetic: boolean,
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
   * A number of kept elements in undo history.
   *
   * @default 20
   *
   * @category Undo and Redo
   */
  undoLimit: number,
  /**
   * If set true, then criterions in functions (SUMIF, COUNTIF, ...) can use regular expressions.
   *
   * @default false
   * @category String
   */
  useRegularExpressions: boolean,
  /**
   * If set true, then criterions in functions (SUMIF, COUNTIF, ...) can use wildcards '*' and '?'.
   *
   * @default true
   * @category String
   */
  useWildcards: boolean,
}

export type ConfigParamsList = keyof ConfigParams

export class Config implements ConfigParams, ParserConfig {

  public static defaultConfig: ConfigParams = {
    accentSensitive: false,
    binarySearchThreshold: 20,
    currencySymbol: ['$'],
    caseSensitive: false,
    caseFirst: 'lower',
    chooseAddressMappingPolicy: new AlwaysDense(),
    dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
    decimalSeparator: '.',
    evaluateNullToZero: false,
    functionArgSeparator: ',',
    functionPlugins: [],
    gpujs: undefined,
    gpuMode: 'gpu',
    ignorePunctuation: false,
    language: 'enGB',
    licenseKey: '',
    leapYear1900: false,
    localeLang: 'en',
    matchWholeCell: true,
    maxRows: 40_000,
    maxColumns: 18_278,
    nullYear: 30,
    nullDate: {year: 1899, month: 12, day: 30},
    parseDateTime: defaultParseToDateTime,
    precisionEpsilon: 1e-13,
    precisionRounding: 14,
    smartRounding: true,
    stringifyDateTime: defaultStringifyDateTime,
    stringifyDuration: defaultStringifyDuration,
    timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
    thousandSeparator: '',
    undoLimit: 20,
    useRegularExpressions: false,
    useWildcards: true,
    useColumnIndex: false,
    useStats: false,
    useArrayArithmetic: false,
  }

  /** @inheritDoc */
  public readonly useArrayArithmetic: boolean
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
  public readonly gpujs?: typeof GPU
  /** @inheritDoc */
  public readonly gpuMode: GPUMode
  /** @inheritDoc */
  public readonly leapYear1900: boolean
  /** @inheritDoc */
  public readonly ignorePunctuation: boolean
  /** @inheritDoc */
  public readonly localeLang: string
  /** @inheritDoc */
  public readonly evaluateNullToZero: boolean
  /** @inheritDoc */
  public readonly nullYear: number
  /** @inheritDoc */
  public readonly parseDateTime: (dateString: string, dateFormat: Maybe<string>, timeFormat: Maybe<string>) => Maybe<SimpleDateTime>
  /** @inheritDoc */
  public readonly stringifyDateTime: (date: SimpleDateTime, formatArg: string) => Maybe<string>
  /** @inheritDoc */
  public readonly stringifyDuration: (time: SimpleTime, formatArg: string) => Maybe<string>
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
  public readonly binarySearchThreshold: number
  /** @inheritDoc */
  public readonly nullDate: SimpleDate
  /** @inheritDoc */
  public readonly currencySymbol: string[]
  /** @inheritDoc */
  public readonly undoLimit: number
  /**
   * Built automatically based on translation package.
   *
   * @internal
   */
  public readonly errorMapping: Record<string, TranslatableErrorType>
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
  public readonly useRegularExpressions: boolean
  public readonly useWildcards: boolean
  public readonly matchWholeCell: boolean
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
      binarySearchThreshold,
      caseSensitive,
      caseFirst,
      chooseAddressMappingPolicy,
      currencySymbol,
      dateFormats,
      decimalSeparator,
      evaluateNullToZero,
      functionArgSeparator,
      functionPlugins,
      gpujs,
      gpuMode,
      ignorePunctuation,
      leapYear1900,
      localeLang,
      language,
      licenseKey,
      matchWholeCell,
      maxRows,
      maxColumns,
      nullYear,
      nullDate,
      parseDateTime,
      precisionEpsilon,
      precisionRounding,
      stringifyDateTime,
      stringifyDuration,
      smartRounding,
      timeFormats,
      thousandSeparator,
      useArrayArithmetic,
      useStats,
      undoLimit,
      useColumnIndex,
      useRegularExpressions,
      useWildcards,
    }: Partial<ConfigParams> = {},
  ) {
    this.useArrayArithmetic = configValueFromParam(useArrayArithmetic, 'boolean', 'useArrayArithmetic')
    this.accentSensitive = configValueFromParam(accentSensitive, 'boolean', 'accentSensitive')
    this.caseSensitive = configValueFromParam(caseSensitive, 'boolean', 'caseSensitive')
    this.caseFirst = configValueFromParam(caseFirst, ['upper', 'lower', 'false'], 'caseFirst')
    this.ignorePunctuation = configValueFromParam(ignorePunctuation, 'boolean', 'ignorePunctuation')
    this.chooseAddressMappingPolicy = chooseAddressMappingPolicy ?? Config.defaultConfig.chooseAddressMappingPolicy
    this.dateFormats = configValueFromParamCheck(dateFormats, Array.isArray, 'array', 'dateFormats')
    this.timeFormats = configValueFromParamCheck(timeFormats, Array.isArray, 'array', 'timeFormats')
    this.functionArgSeparator = configValueFromParam(functionArgSeparator, 'string', 'functionArgSeparator')
    this.decimalSeparator = configValueFromParam(decimalSeparator, ['.', ','], 'decimalSeparator')
    this.language = configValueFromParam(language, 'string', 'language')
    this.licenseKey = configValueFromParam(licenseKey, 'string', 'licenseKey')
    this.#licenseKeyValidityState = checkLicenseKeyValidity(this.licenseKey)
    this.thousandSeparator = configValueFromParam(thousandSeparator, ['', ',', ' ', '.'], 'thousandSeparator')
    this.localeLang = configValueFromParam(localeLang, 'string', 'localeLang')
    this.functionPlugins = functionPlugins ?? Config.defaultConfig.functionPlugins
    this.gpujs = gpujs ?? Config.defaultConfig.gpujs
    this.gpuMode = configValueFromParam(gpuMode, PossibleGPUModeString, 'gpuMode')
    this.smartRounding = configValueFromParam(smartRounding, 'boolean', 'smartRounding')
    this.evaluateNullToZero = configValueFromParam(evaluateNullToZero, 'boolean', 'evaluateNullToZero')
    this.nullYear = configValueFromParam(nullYear, 'number', 'nullYear')
    validateNumberToBeAtLeast(this.nullYear, 'nullYear', 0)
    validateNumberToBeAtMost(this.nullYear, 'nullYear', 100)
    this.precisionRounding = configValueFromParam(precisionRounding, 'number', 'precisionRounding')
    validateNumberToBeAtLeast(this.precisionRounding, 'precisionRounding', 0)
    this.precisionEpsilon = configValueFromParam(precisionEpsilon, 'number', 'precisionEpsilon')
    validateNumberToBeAtLeast(this.precisionEpsilon, 'precisionEpsilon', 0)
    this.useColumnIndex = configValueFromParam(useColumnIndex, 'boolean', 'useColumnIndex')
    this.useStats = configValueFromParam(useStats, 'boolean', 'useStats')
    this.binarySearchThreshold = configValueFromParam(binarySearchThreshold, 'number', 'binarySearchThreshold')
    validateNumberToBeAtLeast(this.binarySearchThreshold, 'binarySearchThreshold', 1)
    this.parseDateTime = configValueFromParam(parseDateTime, 'function', 'parseDateTime')
    this.stringifyDateTime = configValueFromParam(stringifyDateTime, 'function', 'stringifyDateTime')
    this.stringifyDuration = configValueFromParam(stringifyDuration, 'function', 'stringifyDuration')
    this.translationPackage = HyperFormula.getLanguage(this.language)
    this.errorMapping = this.translationPackage.buildErrorMapping()
    this.nullDate = configValueFromParamCheck(nullDate, instanceOfSimpleDate, 'IDate', 'nullDate')
    this.leapYear1900 = configValueFromParam(leapYear1900, 'boolean', 'leapYear1900')
    this.undoLimit = configValueFromParam(undoLimit, 'number', 'undoLimit')
    this.useRegularExpressions = configValueFromParam(useRegularExpressions, 'boolean', 'useRegularExpressions')
    this.useWildcards = configValueFromParam(useWildcards, 'boolean', 'useWildcards')
    this.matchWholeCell = configValueFromParam(matchWholeCell, 'boolean', 'matchWholeCell')
    validateNumberToBeAtLeast(this.undoLimit, 'undoLimit', 0)
    this.maxRows = configValueFromParam(maxRows, 'number', 'maxRows')
    validateNumberToBeAtLeast(this.maxRows, 'maxRows', 1)
    this.maxColumns = configValueFromParam(maxColumns, 'number', 'maxColumns')
    this.currencySymbol = configValueFromParamCheck(currencySymbol, Array.isArray, 'array',  'currencySymbol')
    this.currencySymbol.forEach((val) => {
      if(typeof val !== 'string') {
        throw new ExpectedValueOfTypeError('string[]', 'currencySymbol')
      }
      if(val === '') {
        throw new ConfigValueEmpty('currencySymbol')
      }
    })
    validateNumberToBeAtLeast(this.maxColumns, 'maxColumns', 1)

    configCheckIfParametersNotInConflict(
      {value: this.decimalSeparator, name: 'decimalSeparator'},
      {value: this.functionArgSeparator, name: 'functionArgSeparator'},
      {value: this.thousandSeparator, name: 'thousandSeparator'}
    )
  }

  public getConfig(): ConfigParams {
    const ret: { [key: string]: any } = {}
    for (const key in Config.defaultConfig) {
      const val = this[key as ConfigParamsList]
      if (Array.isArray(val)) {
        ret[key] = [...val]
      } else {
        ret[key] = val
      }
    }
    return ret as ConfigParams
  }


  public mergeConfig(init: Partial<ConfigParams>): Config {
    const mergedConfig: ConfigParams = Object.assign({}, this.getConfig(), init)

    return new Config(mergedConfig)
  }

  private warnDeprecatedIfUsed(inputValue: any, paramName: string, fromVersion: string, replacementName: string) {
    if (inputValue !== undefined) {
      console.warn(`${paramName} option is deprecated since ${fromVersion}, please use ${replacementName}`)
    }
  }
}
