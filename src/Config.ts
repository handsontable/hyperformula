import {GPUInternalMode, GPUMode} from 'gpu.js'
import {AlwaysDense, IChooseAddressMapping} from './DependencyGraph/ChooseAddressMappingPolicy'
import {enGB, TranslationPackage} from './i18n'
import {BooleanPlugin} from './interpreter/plugin/BooleanPlugin'
import {CountUniquePlugin} from './interpreter/plugin/CountUniquePlugin'
import {DatePlugin} from './interpreter/plugin/DatePlugin'
import {ExpPlugin} from './interpreter/plugin/ExpPlugin'
import {InformationPlugin} from './interpreter/plugin/InformationPlugin'
import {MatrixPlugin} from './interpreter/plugin/MatrixPlugin'
import {MedianPlugin} from './interpreter/plugin/MedianPlugin'
import {NumericAggregationPlugin} from './interpreter/plugin/NumericAggregationPlugin'
import {RandomPlugin} from './interpreter/plugin/RandomPlugin'
import {SumifPlugin} from './interpreter/plugin/SumifPlugin'
import {SumprodPlugin} from './interpreter/plugin/SumprodPlugin'
import {TextPlugin} from './interpreter/plugin/TextPlugin'
import {TrigonometryPlugin} from './interpreter/plugin/TrigonometryPlugin'
import {VlookupPlugin} from './interpreter/plugin/VlookupPlugin'

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
    matrixDetection: true,
    matrixDetectionThreshold: 100,
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
    RandomPlugin,
    VlookupPlugin,
  ]

  public readonly chooseAddressMappingPolicy: IChooseAddressMapping
  public readonly dateFormat: string
  public readonly functionArgSeparator: string
  public readonly language: TranslationPackage
  public readonly functionPlugins: any[]
  public readonly gpuMode: PossibleGPUMode
  public readonly matrixDetection: boolean
  public readonly matrixDetectionThreshold: number
  public readonly useColumnIndex: boolean
  public readonly vlookupThreshold: number

  constructor(
      {
        chooseAddressMappingPolicy,
        dateFormat,
        functionArgSeparator,
        language,
        functionPlugins,
        gpuMode,
        matrixDetection,
        matrixDetectionThreshold,
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
    this.matrixDetection = typeof matrixDetection === 'boolean' ? matrixDetection : Config.defaultConfig.matrixDetection
    this.matrixDetectionThreshold = typeof matrixDetectionThreshold === 'number' ? matrixDetectionThreshold : Config.defaultConfig.matrixDetectionThreshold
    this.useColumnIndex = typeof useColumnIndex === 'boolean' ? useColumnIndex : Config.defaultConfig.useColumnIndex
    this.vlookupThreshold = typeof vlookupThreshold === 'number' ? vlookupThreshold : Config.defaultConfig.vlookupThreshold
  }

  public getFunctionTranslationFor(functionTranslationKey: string): string {
    return this.language.functions[functionTranslationKey]
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
}
