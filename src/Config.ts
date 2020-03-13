import {GPUMode} from 'gpu.js'
import {ErrorType} from './Cell'
import {DateHelper, defaultParseDate, instanceOfSimpleDate, SimpleDate} from './DateHelper'
import {ExpectedOneOfValues, ExpectedValueOfType} from './errors'
import {AlwaysDense, ChooseAddressMapping} from './DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {defaultStringifyDate} from './format/format'
import {enGB, TranslationPackage} from './i18n'
import {AbsPlugin} from './interpreter/plugin/AbsPlugin'
import {BitShiftPlugin} from './interpreter/plugin/BitShiftPlugin'
import {BitwiseLogicOperationsPlugin} from './interpreter/plugin/BitwiseLogicOperationsPlugin'
import {BooleanPlugin} from './interpreter/plugin/BooleanPlugin'
import {CharPlugin} from './interpreter/plugin/CharPlugin'
import {CodePlugin} from './interpreter/plugin/CodePlugin'
import {CorrelPlugin} from './interpreter/plugin/CorrelPlugin'
import {CountUniquePlugin} from './interpreter/plugin/CountUniquePlugin'
import {DatePlugin} from './interpreter/plugin/DatePlugin'
import {DegreesPlugin} from './interpreter/plugin/DegreesPlugin'
import {DeltaPlugin} from './interpreter/plugin/DeltaPlugin'
import {ErrorFunctionPlugin} from './interpreter/plugin/ErrorFunctionPlugin'
import {ExpPlugin} from './interpreter/plugin/ExpPlugin'
import {InformationPlugin} from './interpreter/plugin/InformationPlugin'
import {IsEvenPlugin} from './interpreter/plugin/IsEvenPlugin'
import {IsOddPlugin} from './interpreter/plugin/IsOddPlugin'
import {LogarithmPlugin} from './interpreter/plugin/LogarithmPlugin'
import {MathConstantsPlugin} from './interpreter/plugin/MathConstantsPlugin'
import {MatrixPlugin} from './interpreter/plugin/MatrixPlugin'
import {MedianPlugin} from './interpreter/plugin/MedianPlugin'
import {ModuloPlugin} from './interpreter/plugin/ModuloPlugin'
import {NumericAggregationPlugin} from './interpreter/plugin/NumericAggregationPlugin'
import {PowerPlugin} from './interpreter/plugin/PowerPlugin'
import {RadiansPlugin} from './interpreter/plugin/RadiansPlugin'
import {RadixConversionPlugin} from './interpreter/plugin/RadixConversionPlugin'
import {RandomPlugin} from './interpreter/plugin/RandomPlugin'
import {RoundingPlugin} from './interpreter/plugin/RoundingPlugin'
import {SqrtPlugin} from './interpreter/plugin/SqrtPlugin'
import {SumifPlugin} from './interpreter/plugin/SumifPlugin'
import {SumprodPlugin} from './interpreter/plugin/SumprodPlugin'
import {TextPlugin} from './interpreter/plugin/TextPlugin'
import {TrigonometryPlugin} from './interpreter/plugin/TrigonometryPlugin'
import {VlookupPlugin} from './interpreter/plugin/VlookupPlugin'
import {ParserConfig} from './parser/ParserConfig'

const PossibleGPUModeString: GPUMode[] = ['gpu', 'cpu', 'dev']

export interface ConfigParams {
  caseSensitive: boolean,
  chooseAddressMappingPolicy: ChooseAddressMapping,
  dateFormats: string[],
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  language: TranslationPackage,
  functionPlugins: any[],
  gpuMode: GPUMode,
  leapYear1900: boolean,
  matrixDetection: boolean,
  matrixDetectionThreshold: number,
  nullYear: number,
  parseDate: (dateString: string, dateFormats: string[], dateHelper: DateHelper) => SimpleDate | null,
  precisionEpsilon: number,
  precisionRounding: number,
  stringifyDate: (dateNumber: number, dateFormat: string, dateHelper: DateHelper) => string | null,
  smartRounding: boolean,
  useColumnIndex: boolean,
  vlookupThreshold: number,
  nullDate: SimpleDate,
}

type ConfigParamsList = keyof ConfigParams

export class Config implements ConfigParams, ParserConfig{

  public static defaultConfig: ConfigParams = {
    caseSensitive: false,
    chooseAddressMappingPolicy: new AlwaysDense(),
    dateFormats: ['MM/DD/YYYY', 'MM/DD/YY'],
    functionArgSeparator: ',',
    decimalSeparator: '.',
    language: enGB,
    functionPlugins: [],
    gpuMode: 'gpu',
    leapYear1900: false,
    smartRounding: true,
    matrixDetection: true,
    matrixDetectionThreshold: 100,
    nullYear: 30,
    parseDate: defaultParseDate,
    stringifyDate: defaultStringifyDate,
    precisionEpsilon: 1e-13,
    precisionRounding: 14,
    useColumnIndex: false,
    vlookupThreshold: 20,
    nullDate: {year: 1899, month: 12, day: 30},
  }

  private static defaultPlugins: any[] = [
    SumifPlugin,
    TextPlugin,
    NumericAggregationPlugin,
    MedianPlugin,
    DatePlugin,
    BooleanPlugin,
    InformationPlugin,
    TrigonometryPlugin,
    CountUniquePlugin,
    SumprodPlugin,
    MatrixPlugin,
    ExpPlugin,
    AbsPlugin,
    DegreesPlugin,
    RadiansPlugin,
    RandomPlugin,
    VlookupPlugin,
    IsEvenPlugin,
    IsOddPlugin,
    RoundingPlugin,
    RadixConversionPlugin,
    LogarithmPlugin,
    BitwiseLogicOperationsPlugin,
    BitShiftPlugin,
    PowerPlugin,
    MathConstantsPlugin,
    SqrtPlugin,
    ModuloPlugin,
    DeltaPlugin,
    CharPlugin,
    CodePlugin,
    ErrorFunctionPlugin,
    CorrelPlugin,
  ]

  public readonly caseSensitive: boolean
  public readonly chooseAddressMappingPolicy: ChooseAddressMapping
  public readonly dateFormats: string[]
  public readonly functionArgSeparator: string
  public readonly decimalSeparator: '.' | ','
  public readonly language: TranslationPackage
  public readonly functionPlugins: any[]
  public readonly gpuMode: GPUMode
  public readonly leapYear1900: boolean
  public readonly matrixDetection: boolean
  public readonly matrixDetectionThreshold: number
  public readonly nullYear: number
  public readonly parseDate: (dateString: string, dateFormats: string[], dateHelper: DateHelper) => SimpleDate | null
  public readonly stringifyDate: (value: number, formatArg: string, dateHelper: DateHelper) => string | null
  public readonly precisionEpsilon: number
  public readonly precisionRounding: number
  public readonly smartRounding: boolean
  public readonly useColumnIndex: boolean
  public readonly vlookupThreshold: number
  public readonly errorMapping: Record<string, ErrorType>
  public readonly nullDate: SimpleDate

  constructor(
    {
      caseSensitive,
      chooseAddressMappingPolicy,
      dateFormats,
      functionArgSeparator,
      decimalSeparator,
      language,
      functionPlugins,
      gpuMode,
      leapYear1900,
      smartRounding,
      matrixDetection,
      matrixDetectionThreshold,
      nullYear,
      parseDate,
      stringifyDate,
      precisionEpsilon,
      precisionRounding,
      useColumnIndex,
      vlookupThreshold,
      nullDate,
    }: Partial<ConfigParams> = {},
  ) {
    this.caseSensitive = this.valueFromParam(caseSensitive, Config.defaultConfig, 'boolean', 'caseSensitive')
    this.chooseAddressMappingPolicy = chooseAddressMappingPolicy || Config.defaultConfig.chooseAddressMappingPolicy
    this.dateFormats = this.valueFromParamCheck(dateFormats, Config.defaultConfig, Array.isArray, 'array', 'dateFormats')
    this.functionArgSeparator = this.valueFromParam(functionArgSeparator, Config.defaultConfig, 'string', 'functionArgSeparator')
    this.decimalSeparator = this.valueFromParam(decimalSeparator, Config.defaultConfig, ['.', ','], 'decimalSeparator')
    this.language = language || Config.defaultConfig.language
    this.functionPlugins = functionPlugins || Config.defaultConfig.functionPlugins
    this.gpuMode = this.valueFromParam(gpuMode, Config.defaultConfig, PossibleGPUModeString, 'gpuMode')
    this.smartRounding = this.valueFromParam(smartRounding, Config.defaultConfig, 'boolean', 'smartRounding')
    this.matrixDetection = this.valueFromParam(matrixDetection, Config.defaultConfig, 'boolean', 'matrixDetection')
    this.matrixDetectionThreshold = this.valueFromParam(matrixDetectionThreshold, Config.defaultConfig, 'number', 'matrixDetectionThreshold')
    this.nullYear = this.valueFromParam(nullYear, Config.defaultConfig, 'number', 'nullYear')
    this.precisionRounding = this.valueFromParam(precisionRounding, Config.defaultConfig, 'number', 'precisionRounding')
    this.precisionEpsilon = this.valueFromParam(precisionEpsilon, Config.defaultConfig, 'number', 'precisionEpsilon')
    if (!this.smartRounding) {
      this.precisionEpsilon = 0
    }
    this.useColumnIndex = this.valueFromParam(useColumnIndex, Config.defaultConfig, 'boolean', 'useColumnIndex')
    this.vlookupThreshold = this.valueFromParam(vlookupThreshold, Config.defaultConfig, 'number', 'vlookupThreshold')
    this.errorMapping = this.buildErrorMapping(this.language)
    this.parseDate = this.valueFromParam(parseDate, Config.defaultConfig, 'function', 'parseDate')
    this.stringifyDate = this.valueFromParam(stringifyDate, Config.defaultConfig, 'function', 'stringifyDate')
    this.nullDate = this.valueFromParamCheck(nullDate, Config.defaultConfig, instanceOfSimpleDate, 'IDate', 'nullDate' )
    this.leapYear1900 = this.valueFromParam(leapYear1900, Config.defaultConfig, 'boolean', 'leapYear1900')

    if (this.decimalSeparator === this.functionArgSeparator) {
      throw Error('Config initialization failed. Function argument separator and decimal separator needs to differ.')
    }
  }

  public getFunctionTranslationFor = (functionTranslationKey: string): string => {
    return this.language.functions[functionTranslationKey]
  }

  public getErrorTranslationFor = (functionTranslationKey: ErrorType): string => {
    return this.language.errors[functionTranslationKey]
  }

  public numericStringToNumber = (input: string): number => {
    const normalized = input.replace(this.decimalSeparator, '.')
    return Number(normalized)
  }

  public allFunctionPlugins(): any[] {
    return [...Config.defaultPlugins, ...this.functionPlugins]
  }

  public volatileFunctions(): Set<string> {
    const volatileFunctions = new Set<string>()

    for (const plugin of this.allFunctionPlugins()) {
      for (const functionKey in plugin.implementedFunctions) {
        const pluginFunctionData = plugin.implementedFunctions[functionKey]
        if (pluginFunctionData.isVolatile) {
          volatileFunctions.add(this.getFunctionTranslationFor(pluginFunctionData.translationKey))
        }
      }
    }

    return volatileFunctions
  }

  public structuralChangeFunctions(): Set<string> {
    const structuralChangeFunctions = new Set<string>()

    for (const plugin of this.allFunctionPlugins()) {
      for (const functionKey in plugin.implementedFunctions) {
        const pluginFunctionData = plugin.implementedFunctions[functionKey]
        if (pluginFunctionData.isDependentOnSheetStructureChange) {
          structuralChangeFunctions.add(this.getFunctionTranslationFor(pluginFunctionData.translationKey))
        }
      }
    }
    return structuralChangeFunctions
  }

  public functionsWhichDoesNotNeedArgumentsToBeComputed(): Set<string> {
    const functionsWhichDoesNotNeedArgumentsToBeComputed = new Set<string>()

    for (const plugin of this.allFunctionPlugins()) {
      for (const functionKey in plugin.implementedFunctions) {
        const pluginFunctionData = plugin.implementedFunctions[functionKey]
        if (pluginFunctionData.doesNotNeedArgumentsToBeComputed) {
          functionsWhichDoesNotNeedArgumentsToBeComputed.add(this.getFunctionTranslationFor(pluginFunctionData.translationKey))
        }
      }
    }
    return functionsWhichDoesNotNeedArgumentsToBeComputed
  }

  public getRegisteredFunctions(): Set<String> {
    const ret = new Set<String>()
    for (const pluginClass of Config.defaultPlugins) {
      Object.keys(pluginClass.implementedFunctions).forEach((pluginFunction) => {
        ret.add(pluginClass.implementedFunctions[pluginFunction].translationKey.toUpperCase())
      })
    }
    return ret
  }

  private buildErrorMapping(language: TranslationPackage): Record<string, ErrorType> {
    return Object.keys(language.errors).reduce((ret, key) => {
      ret[language.errors[key as ErrorType]] = key as ErrorType
      return ret
    }, {} as Record<string, ErrorType>)
  }

  private valueFromParam(inputValue: any, baseConfig: ConfigParams, expectedType: string | string[], paramName: ConfigParamsList ) {
    if(typeof inputValue === 'undefined') {
      return baseConfig[paramName]
    } else if(typeof expectedType === 'string') {
      if(typeof inputValue === expectedType) {
        return inputValue
      } else {
        throw new ExpectedValueOfType(expectedType, paramName)
      }
    } else {
      if(expectedType.includes(inputValue)) {
        return inputValue
      } else {
        throw new ExpectedOneOfValues(expectedType.map((val: string) => '\''+val+'\'').join(' '), paramName)
      }
    }
  }

  private valueFromParamCheck(inputValue: any, baseConfig: ConfigParams, typeCheck: (object: any) => boolean, expectedType: string, paramName: ConfigParamsList ) {
    if (typeCheck(inputValue)) {
      return inputValue
    } else if (typeof inputValue === 'undefined') {
      return baseConfig[paramName]
    } else {
      throw new ExpectedValueOfType(expectedType, paramName)
    }
  }
}
