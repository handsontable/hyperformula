import {GPUInternalMode, GPUMode} from 'gpu.js'

type PossibleGPUMode = GPUMode | GPUInternalMode

export interface ConfigParams {
  addressMappingFillThreshold: number,
  dateFormat: string,
  functionArgSeparator: string,
  language: string,
  functionPlugins: any[],
  gpuMode: PossibleGPUMode,
  matrixDetection: boolean,
  matrixDetectionThreshold: number,
}

export class Config {
  public static defaultConfig: ConfigParams = {
    addressMappingFillThreshold: 1,
    dateFormat: 'MM/DD/YYYY',
    functionArgSeparator: ',',
    language: 'EN',
    functionPlugins: [],
    gpuMode: 'gpu',
    matrixDetection: true,
    matrixDetectionThreshold: 100
  }

  public readonly addressMappingFillThreshold: number
  public readonly dateFormat: string
  public readonly functionArgSeparator: string
  public readonly language: string
  public readonly functionPlugins: any[]
  public readonly gpuMode: PossibleGPUMode
  public readonly matrixDetection: boolean
  public readonly matrixDetectionThreshold: number

  constructor(
      {
        addressMappingFillThreshold,
        dateFormat,
        functionArgSeparator,
        language,
        functionPlugins,
        gpuMode,
        matrixDetection,
        matrixDetectionThreshold
      }: Partial<ConfigParams> = {}
  ) {
    this.addressMappingFillThreshold = addressMappingFillThreshold || Config.defaultConfig.addressMappingFillThreshold
    this.dateFormat = dateFormat || Config.defaultConfig.dateFormat
    this.functionArgSeparator = functionArgSeparator || Config.defaultConfig.functionArgSeparator
    this.language = language || Config.defaultConfig.language
    this.functionPlugins = functionPlugins || Config.defaultConfig.functionPlugins
    this.gpuMode = gpuMode || Config.defaultConfig.gpuMode
    this.matrixDetection = typeof matrixDetection === 'boolean' ? matrixDetection : Config.defaultConfig.matrixDetection
    this.matrixDetectionThreshold = matrixDetectionThreshold || Config.defaultConfig.matrixDetectionThreshold
  }
}
