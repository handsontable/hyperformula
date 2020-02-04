import {GPUInternalMode, GPUMode} from 'gpu.js'
import {ErrorType} from './Cell'
import {IDate, parseDate} from './Date'
import {AlwaysDense, IChooseAddressMapping} from './DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {enGB, TranslationPackage} from './i18n'
import {AbsPlugin} from './interpreter/plugin/AbsPlugin'
import {BitShiftPlugin} from './interpreter/plugin/BitShiftPlugin'
import {BitwiseLogicOperationsPlugin} from './interpreter/plugin/BitwiseLogicOperationsPlugin'
import {BooleanPlugin} from './interpreter/plugin/BooleanPlugin'
import {CharPlugin} from './interpreter/plugin/CharPlugin'
import {CodePlugin} from './interpreter/plugin/CodePlugin'
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
import {CorrelPlugin} from './interpreter/plugin/CorrelPlugin'
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
import {stringifyDate} from './format/format'

type PossibleGPUMode = GPUMode | GPUInternalMode

export interface ConfigParams {
  chooseAddressMappingPolicy: IChooseAddressMapping,
  dateFormat: string,
  functionArgSeparator: string,
  language: TranslationPackage,
  functionPlugins: any[],
  gpuMode: PossibleGPUMode,
  matrixDetection: boolean,
  matrixDetectionThreshold: number,
  parseDate: (dateString: string, dateFormat: string) => IDate | null
  stringifyDate: (dateNumber: number, dateFormat: string) => string | null
  precisionEpsilon: number,
  precisionRounding: number,
  smartRounding: boolean,
  useColumnIndex: boolean,
  vlookupThreshold: number
}

export class Config {

  public static defaultConfig: ConfigParams = {
    chooseAddressMappingPolicy: new AlwaysDense(),
    dateFormat: 'MM/DD/YYYY',
    functionArgSeparator: ',',
    language: enGB,
    functionPlugins: [],
    gpuMode: 'gpu',
    smartRounding: true,
    matrixDetection: true,
    matrixDetectionThreshold: 100,
    parseDate: parseDate,
    stringifyDate: stringifyDate,
    precisionEpsilon: 1e-13,
    precisionRounding: 14,
    useColumnIndex: false,
    vlookupThreshold: 20,
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

  public readonly chooseAddressMappingPolicy: IChooseAddressMapping
  public readonly dateFormat: string
  public readonly functionArgSeparator: string
  public readonly language: TranslationPackage
  public readonly functionPlugins: any[]
  public readonly gpuMode: PossibleGPUMode
  public readonly matrixDetection: boolean
  public readonly matrixDetectionThreshold: number
  public readonly parseDate: (dateString: string, dateFormat: string) => IDate | null
  public readonly stringifyDate: (value: number, formatArg: string) => string | null
  public readonly precisionEpsilon: number
  public readonly precisionRounding: number
  public readonly smartRounding: boolean
  public readonly useColumnIndex: boolean
  public readonly vlookupThreshold: number
  public readonly errorMapping: Record<string, ErrorType>

  constructor(
      {
        chooseAddressMappingPolicy,
        dateFormat,
        functionArgSeparator,
        language,
        functionPlugins,
        gpuMode,
        smartRounding,
        matrixDetection,
        matrixDetectionThreshold,
        parseDate,
        stringifyDate,
        precisionEpsilon,
        precisionRounding,
        useColumnIndex,
        vlookupThreshold,
      }: Partial<ConfigParams> = {},
  ) {
    this.chooseAddressMappingPolicy = chooseAddressMappingPolicy || Config.defaultConfig.chooseAddressMappingPolicy
    this.dateFormat = dateFormat || Config.defaultConfig.dateFormat
    this.functionArgSeparator = functionArgSeparator || Config.defaultConfig.functionArgSeparator
    this.language = language || Config.defaultConfig.language
    this.functionPlugins = functionPlugins || Config.defaultConfig.functionPlugins
    this.gpuMode = gpuMode || Config.defaultConfig.gpuMode
    this.smartRounding = typeof smartRounding === 'boolean' ? smartRounding : Config.defaultConfig.smartRounding
    this.matrixDetection = typeof matrixDetection === 'boolean' ? matrixDetection : Config.defaultConfig.matrixDetection
    this.matrixDetectionThreshold = typeof matrixDetectionThreshold === 'number' ? matrixDetectionThreshold : Config.defaultConfig.matrixDetectionThreshold
    this.precisionRounding = typeof precisionRounding === 'number' ? precisionRounding : Config.defaultConfig.precisionRounding
    this.precisionEpsilon = typeof precisionEpsilon === 'number' ? precisionEpsilon : Config.defaultConfig.precisionEpsilon
    if(!this.smartRounding) {
      this.precisionEpsilon = 0
    }
    this.useColumnIndex = typeof useColumnIndex === 'boolean' ? useColumnIndex : Config.defaultConfig.useColumnIndex
    this.vlookupThreshold = typeof vlookupThreshold === 'number' ? vlookupThreshold : Config.defaultConfig.vlookupThreshold
    this.errorMapping = this.buildErrorMapping(this.language)
    this.parseDate = typeof parseDate === 'function' || Config.defaultConfig.parseDate
    this.stringifyDate = typeof stringifyDate === 'function' || Config.defaultConfig.stringifyDate
  }

  public getFunctionTranslationFor(functionTranslationKey: string): string {
    return this.language.functions[functionTranslationKey]
  }

  public getErrorTranslationFor(functionTranslationKey: ErrorType): string {
    return this.language.errors[functionTranslationKey]
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

  private buildErrorMapping(language: TranslationPackage): Record<string, ErrorType> {
    return Object.keys(language.errors).reduce((ret, key) => {
      ret[language.errors[key as ErrorType]] = key as ErrorType
      return ret
    }, {} as Record<string, ErrorType>)
  }
}
