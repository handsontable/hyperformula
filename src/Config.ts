/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
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
import {ConfigParams, ConfigParamsList} from './ConfigParams'

const privatePool: WeakMap<Config, { licenseKeyValidityState: LicenseKeyValidityState }> = new WeakMap()

export class Config implements ConfigParams, ParserConfig {

  public static defaultConfig: ConfigParams = {
    accentSensitive: false,
    allowCircularReferences: false,
    currencySymbol: ['$'],
    caseSensitive: false,
    caseFirst: 'lower',
    context: undefined,
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
    precisionRounding: 10,
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
  public readonly allowCircularReferences: boolean
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
  public readonly nullDate: SimpleDate
  /** @inheritDoc */
  public readonly currencySymbol: string[]
  /** @inheritDoc */
  public readonly undoLimit: number
  /** @inheritDoc */
  public readonly context: unknown

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
  /** @inheritDoc */
  public readonly useRegularExpressions: boolean
  /** @inheritDoc */
  public readonly useWildcards: boolean
  /** @inheritDoc */
  public readonly matchWholeCell: boolean

  constructor(options: Partial<ConfigParams> = {}, showDeprecatedWarns: boolean = true) {
    const {
      accentSensitive,
      allowCircularReferences,
      caseSensitive,
      caseFirst,
      chooseAddressMappingPolicy,
      context,
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
    this.allowCircularReferences = configValueFromParam(options.allowCircularReferences, 'boolean', 'allowCircularReferences')
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
    this.context = context

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
    // an example of deprecation warning
    // Config.warnDeprecatedIfUsed(options.binarySearchThreshold, 'binarySearchThreshold', '1.1')
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
