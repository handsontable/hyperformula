/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
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
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   *
   * @default ['$']
   *
   * @category Number
   */
  currencySymbol: string[],
  /**
   * Sets the date formats accepted by the date-parsing function.
   *
   * A format must be specified as a string consisting of tokens and separators.
   *
   * Supported tokens:
   * - `DD` (day of month)
   * - `MM` (month as a number)
   * - `YYYY` (year as a 4-digit number)
   * - `YY` (year as a 2-digit number)
   *
   * Supported separators:
   * - `/` (slash)
   * - `-` (dash)
   * - `.` (dot)
   * - ` ` (empty space)
   *
   * Regardless of the separator specified in the format string, all of the above are accepted by the date-parsing function.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
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
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
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
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
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
   * For more information, see the [Localizing functions guide](/guide/localizing-functions.md).
   *
   * @default 'enGB'
   *
   * @category Formula Syntax
   */
  language: string,
  /**
   * Controls the set of whitespace characters that are allowed inside a formula.
   *
   * When set to `'standard'`, allows only SPACE (U+0020), CHARACTER TABULATION (U+0009), LINE FEED (U+000A), and CARRIAGE RETURN (U+000D) (compliant with OpenFormula Standard 1.3)
   *
   * When set to `'any'`, allows all whitespace characters that would be captured by the `\s` character class of the JavaScript regular expressions.
   *
   * @default 'standard'
   *
   * @category Formula Syntax
   */
  ignoreWhiteSpace: 'standard' | 'any',
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
   * For more information, go [here](/guide/license-key.md).
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
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   *
   * @default 'en'
   *
   * @category String
   */
  localeLang: string,
  /**
   * When set to `true`, function criteria require whole cells to match the pattern.
   *
   * When set to `false`, function criteria require just a sub-word to match the pattern.
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
   * @default 40.000
   *
   * @category Engine
   * */
  maxRows: number,
  /**
   * Sets the maximum number of columns.
   *
   * @default 18.278
   *
   * @category Engine
   * */
  maxColumns: number,
  /**
   * Internally, each date is represented as a number of days that passed since `nullDate`.
   *
   * This option sets a specific date from which that number of days is counted.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
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
   * Sets a function that parses strings representing date-time into actual date-time values.
   *
   * The function should return a [DateTime](../globals.md#datetime) object or undefined.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
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
   * Sets a function that converts date-time values into strings.
   *
   * The function should return a string or undefined.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   *
   * @default defaultStringifyDateTime
   *
   * @category Date and Time
   */
  stringifyDateTime: (dateTime: SimpleDateTime, dateTimeFormat: string) => Maybe<string>,
  /**
   * Sets a function that converts time duration values into strings.
   *
   * The function should return a string or undefined.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
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
   * Sets the thousands' separator symbol for parsing numerical literals.
   *
   * Can be one of the following:
   * - empty
   * - `,` (comma)
   * - ` ` (empty space)
   *
   * Must be different from [[decimalSeparator]] and [[functionArgSeparator]].
   *
   * For more information, see the [Internationalization features guide](/guide/i18n-features.md).
   *
   * @default ''
   *
   * @category Number
   */
  thousandSeparator: '' | ',' | ' ' | '.',
  /**
   * Sets the time formats accepted by the time-parsing function.
   *
   * A format must be specified as a string consisting of at least two tokens separated by `:` (a colon).
   *
   * Supported tokens:
   * - `hh` (hours)
   * - `mm` (minutes)
   * - `ss`, `ss.s`, `ss.ss`, `ss.sss`, `ss.ssss`, etc. (seconds)
   *
   * The number of decimal places in the seconds token does not matter. All versions of the seconds token are equivalent in the context of parsing time values.
   * Regardless of the time format specified, the hours-minutes-seconds value may be followed by the AM/PM designator.
   *
   * For more information, see the [Date and time handling guide](/guide/date-and-time-handling.md).
   *
   * @example
   * E.g. for `timeFormats = ['hh:mm:ss.sss']`, valid time strings include:
   * - `1:33:33`
   * - `1:33:33.3`
   * - `1:33:33.33`
   * - `1:33:33.333`
   * - `01:33:33`
   * - `1:33:33 AM`
   * - `1:33:33 PM`
   * - `1:33:33 am`
   * - `1:33:33 pm`
   * - `1:33:33AM`
   * - `1:33:33PM`
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
   * For more information, see the [Arrays guide](/guide/arrays.md).
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
    ignorePunctuation: false,
    language: 'enGB',
    ignoreWhiteSpace: 'standard',
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
  public readonly ignoreWhiteSpace: 'standard' | 'any'
  /** @inheritDoc */
  public readonly licenseKey: string
  /** @inheritDoc */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly functionPlugins: FunctionPluginDefinition[]
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
  public readonly parseDateTime: (dateTimeString: string, dateFormat?: string, timeFormat?: string) => Maybe<DateTime>
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

  constructor(options: Partial<ConfigParams> = {}, showDeprecatedWarns: boolean = true) {
    const {
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
      ignorePunctuation,
      leapYear1900,
      localeLang,
      language,
      ignoreWhiteSpace,
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
    } = options

    if (showDeprecatedWarns) {
      Config.warnDeprecatedOptions(options)
    }

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
    this.ignoreWhiteSpace = configValueFromParam(ignoreWhiteSpace, ['standard', 'any'], 'ignoreWhiteSpace')
    this.licenseKey = configValueFromParam(licenseKey, 'string', 'licenseKey')
    this.thousandSeparator = configValueFromParam(thousandSeparator, ['', ',', ' ', '.'], 'thousandSeparator')
    this.arrayColumnSeparator = configValueFromParam(arrayColumnSeparator, [',', ';'], 'arrayColumnSeparator')
    this.arrayRowSeparator = configValueFromParam(arrayRowSeparator, [';', '|'], 'arrayRowSeparator')
    this.localeLang = configValueFromParam(localeLang, 'string', 'localeLang')
    this.functionPlugins = [...(functionPlugins ?? Config.defaultConfig.functionPlugins)]
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
    this.binarySearchThreshold = binarySearchThreshold ?? Config.defaultConfig.binarySearchThreshold
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
    this.currencySymbol = this.setupCurrencySymbol(currencySymbol)
    validateNumberToBeAtLeast(this.maxColumns, 'maxColumns', 1)

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

  private setupCurrencySymbol(currencySymbol: string[] | undefined): string[] {
    const valueAfterCheck = [...configValueFromParamCheck(currencySymbol, Array.isArray, 'array', 'currencySymbol')]

    valueAfterCheck.forEach((val) => {
      if (typeof val !== 'string') {
        throw new ExpectedValueOfTypeError('string[]', 'currencySymbol')
      }

      if (val === '') {
        throw new ConfigValueEmpty('currencySymbol')
      }
    })

    return valueAfterCheck as string[]
  }

  /**
   * Proxied property to its private counterpart. This makes the property
   * as accessible as the other Config options but without ability to change the value.
   *
   * @internal
   */
  public get licenseKeyValidityState(): LicenseKeyValidityState {
    return (privatePool.get(this) as Config).licenseKeyValidityState
  }

  public getConfig(): ConfigParams {
    return getFullConfigFromPartial(this)
  }

  public mergeConfig(init: Partial<ConfigParams>): Config {
    const mergedConfig: ConfigParams = Object.assign({}, this.getConfig(), init)

    Config.warnDeprecatedOptions(init)

    return new Config(mergedConfig, false)
  }

  private static warnDeprecatedOptions(options: Partial<ConfigParams>) {
    Config.warnDeprecatedIfUsed(options.binarySearchThreshold, 'binarySearchThreshold', '1.1')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static warnDeprecatedIfUsed(inputValue: any, paramName: string, fromVersion: string, replacementName?: string) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
