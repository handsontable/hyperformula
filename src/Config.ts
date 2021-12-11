/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

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
const privatePool: WeakMap<Config, { licenseKeyValidityState: LicenseKeyValidityState }> = new WeakMap()

export interface ConfigParams {
  /**
   * When set to `true`, makes string comparison accent-sensitive.
   *
   * Applies only to comparison operators.
   *
   * @default false
   *
   * @category String
   */
  accentSensitive: boolean,
  /**
   * Sets a minimum number of elements that a range must have to use binary search.
   *
   * @deprecated Every search of sorted data always uses binary search.
   *
   * @default 20
   *
   * @category Engine
   */
  binarySearchThreshold: number,
  /**
   * When set to `true`, makes string comparison case-sensitive.
   *
   * Applies to comparison operators only.
   *
   * @default false
   *
   * @category String
   */
  caseSensitive: boolean,
  /**
   * When set to `upper`, upper case sorts first.
   *
   * When set to `lower`, lower case sorts first.
   *
   * When set to `false`, uses the locale's default.
   *
   * @default 'lower'
   *
   * @category String
   */
  caseFirst: 'upper' | 'lower' | 'false',
  /**
   * Sets the address mapping policy to be used.
   *
   * Built-in implementations:
   * - `DenseSparseChooseBasedOnThreshold`: sets the address mapping policy separately for each sheet, based on fill ratio.
   * - `AlwaysDense`: uses `DenseStrategy` for all sheets.
   * - `AlwaysSparse`: uses `SparseStrategy` for all sheets.
   *
   * @default AlwaysDense
   *
   * @category Engine
   */
  chooseAddressMappingPolicy: ChooseAddressMapping,
  /**
   * Sets symbols that denote currency numbers.
   *
   * @default ['$']
   *
   * @category Number
   */
  currencySymbol: string[],
  /**
   * Sets date formats that are supported by date-parsing functions.
   *
   * The separator is ignored and can be any of the following:
   * - `-` (dash)
   * - ` ` (empty space)
   * - `/` (slash)
   *
   * `YY` can be replaced with `YYYY`.
   *
   * Any order of `YY`, `MM`, and `DD` is accepted as a date.
   *
   * @default ['DD/MM/YYYY', 'DD/MM/YY']
   *
   * @category Date and Time
   */
  dateFormats: string[],
  /**
   * Sets a separator character that separates procedure arguments in formulas.
   *
   * Must be different from [[decimalSeparator]] and [[thousandSeparator]].
   *
   * @default ','
   *
   * @category Formula Syntax
   */
  functionArgSeparator: string,
  /**
   * Sets a decimal separator used for parsing numerical literals.
   *
   * Can be one of the following:
   * - `.` (period)
   * - `,` (comma)
   *
   * Must be different from [[thousandSeparator]] and [[functionArgSeparator]].
   *
   * @default '.'
   *
   * @category Number
   */
  decimalSeparator: '.' | ',',
  /**
   * When set to `true`, formulas evaluating to `null` evaluate to `0` instead.
   *
   * @default false
   *
   * @category Engine
   */
  evaluateNullToZero: boolean,
  /**
   * Lists additional function plugins to be used by the formula interpreter.
   *
   * @default []
   *
   * @category Formula Syntax
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionPlugins: any[],
  /**
   * A GPU.js constructor used by array functions.
   *
   * When not provided, the plain CPU implementation is used.
   *
   * @deprecated since version 1.2.
   *
   * @default undefined
   *
   * @category Engine
   */
  gpujs?: any,
  /**
   * Sets array calculations to use either GPU or CPU.
   *
   * When set to `gpu`, tries to use GPU for array calculations.
   *
   * When set to `cpu`, enforces CPU usage.
   *
   * Use other values only for debugging purposes.
   *
   * For more information, see the [GPU.js documentation](https://github.com/gpujs/gpu.js/#readme).
   *
   * @deprecated since version 1.2
   *
   * @default 'gpu'
   *
   * @category Engine
   */
  gpuMode: GPUMode,
  /**
   * When set to `true`, string comparison ignores punctuation.
   *
   * @default false
   *
   * @category String
   */
  ignorePunctuation: boolean,
  /**
   * Sets a translation package for function and error names.
   *
   * @default 'enGB'
   *
   * @category Formula Syntax
   */
  language: string,
  /**
   * Sets year 1900 as a leap year.
   *
   * For compatibility with Lotus 1-2-3 and Microsoft Excel, set this option to `true`.
   *
   * For more information, see [[nullDate]].
   *
   * @default false
   *
   * @category Date and Time
   */
  leapYear1900: boolean,
  /**
   * Sets your HyperFormula license key.
   *
   * To use HyperFormula on the GPLv3 license terms, set this option to `gpl-v3`.
   *
   * To use HyperFormula with your commercial license, set this option to your valid license key string.
   *
   * For more information, go [here](/guide/license-key.html).
   *
   * @default undefined
   *
   * @category License
   */
  licenseKey: string,
  /**
   * Sets the locale for language-sensitive string comparison.
   *
   * Accepts **IETF BCP 47** language tags.
   *
   * @default 'en'
   *
   * @category String
   */
  localeLang: string,
  /**
   * When set to `true`, function criteria require whole cells to match the pattern.
   *
   * When set to `false`, function criteria require just a subword to match the pattern.
   *
   * @default true
   * @category String
   */
  matchWholeCell: boolean,
  /**
   * Sets a column separator symbol for array notation.
   *
   * @default ','
   * @category Formula Syntax
   */
  arrayColumnSeparator: ',' | ';',
  /**
   * Sets a row separator symbol for array notation.
   *
   * @default ';'
   * @category Formula Syntax
   */
  arrayRowSeparator: ';' | '|',
  /**
   * Sets the maximum number of rows.
   *
   * @default 40,000
   *
   * @category Engine
   * */
  maxRows: number,
  /**
   * Sets the maximum number of columns.
   *
   * @default 18,278
   *
   * @category Engine
   * */
  maxColumns: number,
  /**
   * Internally, each date is represented as a number of days that passed since `nullDate`.
   *
   * This option sets a specific date from which that number of days is counted.
   *
   * @default {year: 1899, month: 12, day: 30}
   *
   * @category Date and Time
   */
  nullDate: SimpleDate,
  /**
   * Sets the interpretation of two-digit year values.
   *
   * Two-digit year values (`xx`) can either become `19xx` or `20xx`.
   *
   * If `xx` is less or equal to `nullYear`, two-digit year values become `20xx`.
   *
   * If `xx` is more than `nullYear`, two-digit year values become `19xx`.
   *
   * @default 30
   *
   * @category Date and Time
   */
  nullYear: number,
  /**
   * Sets a function that parses strings representing date-time into actual date-time.
   *
   * @default defaultParseToDateTime
   *
   * @category Date and Time
   */
  parseDateTime: (dateTimeString: string, dateFormat?: string, timeFormat?: string) => Maybe<DateTime>,
  /**
   * Sets how far two numerical values need to be from each other to be treated as non-equal.
   *
   * `a` and `b` are equal if all three of the following conditions are met:
   * - Both `a` and `b` are of the same sign
   * - `abs(a)` <= `(1+precisionEpsilon) * abs(b)`
   * - `abs(b)` <= `(1+precisionEpsilon) * abs(a)`
   *
   * Additionally, this option controls the snap-to-zero behavior for additions and subtractions:
   * - For `c=a+b`, if `abs(c)` <= `precisionEpsilon * abs(a)`, then `c` is set to `0`
   * - For `c=a-b`, if `abs(c)` <= `precisionEpsilon * abs(a)`, then `c` is set to `0`
   *
   * @default 1e-13
   *
   * @category Number
   */
  precisionEpsilon: number,
  /**
   * Sets the precision level of calculations' output.
   *
   * Internally, all arithmetic operations are performed using JavaScript's built-in numbers.
   * But when HyperFormula exports a cell's value, it rounds the output
   * to the `precisionRounding` number of significant digits.
   *
   * Setting `precisionRounding` too low can cause large numbers' imprecision
   * (for example, with `precisionRounding` set to `4`, 100005 becomes 100010).
   *
   * We recommend setting `precisionRounding` to a value between `10` and `14`.
   *
   * @default 14
   *
   * @category Number
   */
  precisionRounding: number,
  /**
   * Sets a function that converts date-time into strings.
   *
   * @default defaultStringifyDateTime
   *
   * @category Date and Time
   */
  stringifyDateTime: (dateTime: SimpleDateTime, dateTimeFormat: string) => Maybe<string>,
  /**
   * Sets a function that converts time duration into strings.
   *
   * @default defaultStringifyDuration
   *
   * @category Date and Time
   */
  stringifyDuration: (time: SimpleTime, timeFormat: string) => Maybe<string>,
  /**
   * When set to `false`, no rounding happens, and numbers are equal if and only if they are of truly identical value.
   *
   * For more information, see [[precisionEpsilon]].
   *
   * @default true
   *
   * @category Number
   */
  smartRounding: boolean,
  /**
   * Sets a thousands separator symbol for parsing numerical literals.
   *
   * Can be one of the following:
   * - empty
   * - `,` (comma)
   * - ` ` (empty space)
   *
   * Must be different from [[decimalSeparator]] and [[functionArgSeparator]].
   *
   * @default ''
   *
   * @category Number
   */
  thousandSeparator: '' | ',' | ' ' | '.',
  /**
   * Sets time formats that will be supported by time-parsing functions.
   *
   * The separator is `:` (colon).
   *
   * Accepts any configuration of at least two of the following, in any order:
   * - `hh`: hours
   * - `mm`: minutes
   * - `ss`: seconds
   *
   * @default ['hh:mm', 'hh:mm:ss.sss']
   *
   * @category Date and Time
   */
  timeFormats: string[],
  /**
   * When set to `true`, array arithmetic is enabled globally.
   *
   * When set to `false`, array arithmetic is enabled only inside array functions (`ARRAYFORMULA`, `FILTER`, and `ARRAY_CONSTRAIN`).
   *
   * For more information, see the [Arrays guide](/guide/arrays.html).
   *
   * @default false
   *
   * @category Engine
   */
  useArrayArithmetic: boolean,
  /**
   * When set to `true`, switches column search strategy from binary search to column index.
   *
   * Using column index improves efficiency of the `VLOOKUP` and `MATCH` functions, but increases memory usage.
   *
   * When searching with wildcards or regular expressions, column search strategy falls back to binary search (even with `useColumnIndex` set to `true`).
   *
   * @default false
   *
   * @category Engine
   */
  useColumnIndex: boolean,
  /**
   * When set to `true`, enables gathering engine statistics and timings.
   *
   * Useful for testing and benchmarking.
   *
   * @default false
   *
   * @category Engine
   */
  useStats: boolean,
  /**
   * Sets the number of elements kept in the undo history.
   *
   * @default 20
   *
   * @category Undo and Redo
   */
  undoLimit: number,
  /**
   * When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) are allowed to use regular expressions.
   *
   * @default false
   * @category String
   */
  useRegularExpressions: boolean,
  /**
   * When set to `true`, criteria in functions (SUMIF, COUNTIF, ...) can use the `*` and `?` wildcards.
   *
   * @default true
   * @category String
   */
  useWildcards: boolean,
  /**
   * Number of milliseconds until the cell throws a timeout error for async functions.
   *
   * @default 5000
   * @category Engine
   */
   timeoutTime: number,
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
    arrayColumnSeparator: ',',
    arrayRowSeparator: ';',
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
    timeoutTime: 5000
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
  public readonly arrayColumnSeparator: ',' | ';'
  /** @inheritDoc */
  public readonly arrayRowSeparator: ';' | '|'
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
  public readonly gpujs?: any
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
  public readonly parseDateTime: (dateString: string, dateFormat?: string, timeFormat?: string) => Maybe<SimpleDateTime>
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
  /** @inheritDoc */
  public readonly timeoutTime: number
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
      arrayColumnSeparator,
      arrayRowSeparator,
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
      timeoutTime
    }: Partial<ConfigParams> = {},
  ) {
    this.useArrayArithmetic = configValueFromParam(useArrayArithmetic, 'boolean', 'useArrayArithmetic')
    this.accentSensitive = configValueFromParam(accentSensitive, 'boolean', 'accentSensitive')
    this.caseSensitive = configValueFromParam(caseSensitive, 'boolean', 'caseSensitive')
    this.caseFirst = configValueFromParam(caseFirst, ['upper', 'lower', 'false'], 'caseFirst')
    this.ignorePunctuation = configValueFromParam(ignorePunctuation, 'boolean', 'ignorePunctuation')
    this.chooseAddressMappingPolicy = chooseAddressMappingPolicy ?? Config.defaultConfig.chooseAddressMappingPolicy
    this.dateFormats = [...configValueFromParamCheck(dateFormats, Array.isArray, 'array', 'dateFormats')]
    this.timeFormats = [...configValueFromParamCheck(timeFormats, Array.isArray, 'array', 'timeFormats')]
    this.functionArgSeparator = configValueFromParam(functionArgSeparator, 'string', 'functionArgSeparator')
    this.decimalSeparator = configValueFromParam(decimalSeparator, ['.', ','], 'decimalSeparator')
    this.language = configValueFromParam(language, 'string', 'language')
    this.licenseKey = configValueFromParam(licenseKey, 'string', 'licenseKey')
    this.thousandSeparator = configValueFromParam(thousandSeparator, ['', ',', ' ', '.'], 'thousandSeparator')
    this.arrayColumnSeparator = configValueFromParam(arrayColumnSeparator, [',', ';'], 'arrayColumnSeparator')
    this.arrayRowSeparator = configValueFromParam(arrayRowSeparator, [';', '|'], 'arrayRowSeparator')
    this.localeLang = configValueFromParam(localeLang, 'string', 'localeLang')
    this.functionPlugins = [...(functionPlugins ?? Config.defaultConfig.functionPlugins)]
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    this.binarySearchThreshold = undefined
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
    this.timeoutTime = configValueFromParam(timeoutTime, 'number', 'timeoutTime')
    this.matchWholeCell = configValueFromParam(matchWholeCell, 'boolean', 'matchWholeCell')
    validateNumberToBeAtLeast(this.undoLimit, 'undoLimit', 0)
    validateNumberToBeAtLeast(this.timeoutTime, 'timeoutTime', 0)
    this.maxRows = configValueFromParam(maxRows, 'number', 'maxRows')
    validateNumberToBeAtLeast(this.maxRows, 'maxRows', 1)
    this.maxColumns = configValueFromParam(maxColumns, 'number', 'maxColumns')
    this.currencySymbol = [...configValueFromParamCheck(currencySymbol, Array.isArray, 'array', 'currencySymbol')]
    this.currencySymbol.forEach((val) => {
      if (typeof val !== 'string') {
        throw new ExpectedValueOfTypeError('string[]', 'currencySymbol')
      }
      if (val === '') {
        throw new ConfigValueEmpty('currencySymbol')
      }
    })
    validateNumberToBeAtLeast(this.maxColumns, 'maxColumns', 1)
    this.warnDeprecatedIfUsed(binarySearchThreshold, 'binarySearchThreshold', '1.1')
    this.warnDeprecatedIfUsed(gpujs, 'gpujs', '1.2')
    if (gpuMode !== Config.defaultConfig.gpuMode) {
      this.warnDeprecatedIfUsed(gpuMode, 'gpuMode', '1.2')
    }

    privatePool.set(this, {
      licenseKeyValidityState: checkLicenseKeyValidity(this.licenseKey)
    })

    configCheckIfParametersNotInConflict(
      {value: this.decimalSeparator, name: 'decimalSeparator'},
      {value: this.functionArgSeparator, name: 'functionArgSeparator'},
      {value: this.thousandSeparator, name: 'thousandSeparator'},
    )

    configCheckIfParametersNotInConflict(
      {value: this.arrayRowSeparator, name: 'arrayRowSeparator'},
      {value: this.arrayColumnSeparator, name: 'arrayColumnSeparator'},
    )
  }

  /**
   * Proxied property to its private counterpart. This makes the property
   * as accessible as the other Config options but without ability to change the value.
   *
   * @internal
   */
  public get licenseKeyValidityState() {
    return privatePool.get(this)!.licenseKeyValidityState
  }

  public getConfig(): ConfigParams {
    return getFullConfigFromPartial(this)
  }

  public mergeConfig(init: Partial<ConfigParams>): Config {
    const mergedConfig: ConfigParams = Object.assign({}, this.getConfig(), init)

    return new Config(mergedConfig)
  }

  private warnDeprecatedIfUsed(inputValue: any, paramName: string, fromVersion: string, replacementName?: string) {
    if (inputValue !== undefined) {
      if (replacementName === undefined) {
        console.warn(`${paramName} option is deprecated since ${fromVersion}`)
      } else {
        console.warn(`${paramName} option is deprecated since ${fromVersion}, please use ${replacementName}`)
      }
    }
  }
}

function getFullConfigFromPartial(partialConfig: Partial<ConfigParams>): ConfigParams {
  const ret: { [key: string]: any } = {}
  for (const key in Config.defaultConfig) {
    const val = partialConfig[key as ConfigParamsList] ?? Config.defaultConfig[key as ConfigParamsList]
    if (Array.isArray(val)) {
      ret[key] = [...val]
    } else {
      ret[key] = val
    }
  }
  return ret as ConfigParams
}

export function getDefaultConfig(): ConfigParams {
  return getFullConfigFromPartial({})
}

