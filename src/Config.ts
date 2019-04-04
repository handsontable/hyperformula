import {GPUMode, GPUInternalMode} from 'gpu.js';

type PossibleGPUMode = GPUMode | GPUInternalMode | undefined

interface ConfigParams {
  addressMappingFillThreshold?: number,
  csvDelimiter?: string,
  dateFormat?: string,
  functionArgSeparator?: string,
  language?: string,
  functionPlugins?: any[],
  gpuMode?: PossibleGPUMode,
}

export interface DefaultConfigParams {
  addressMappingFillThreshold: number,
  csvDelimiter: string,
  dateFormat: string,
  functionArgSeparator: string,
  language: string,
  functionPlugins: any[],
  gpuMode: PossibleGPUMode,
}

export class Config {
  public static defaultConfig: DefaultConfigParams = {
    addressMappingFillThreshold: 1,
    csvDelimiter: ',',
    dateFormat: 'MM/DD/YYYY',
    functionArgSeparator: ',',
    language: 'EN',
    functionPlugins: [],
    gpuMode: undefined,
  }

  public readonly addressMappingFillThreshold: number
  public readonly csvDelimiter: string
  public readonly dateFormat: string
  public readonly functionArgSeparator: string
  public readonly language: string
  public readonly functionPlugins: any[]
  public readonly gpuMode: PossibleGPUMode

  constructor({
    addressMappingFillThreshold,
    csvDelimiter,
    dateFormat,
    functionArgSeparator,
    language,
    functionPlugins,
    gpuMode
  }: ConfigParams = {}) {
    this.addressMappingFillThreshold = addressMappingFillThreshold || Config.defaultConfig.addressMappingFillThreshold
    this.csvDelimiter = csvDelimiter || Config.defaultConfig.csvDelimiter
    this.dateFormat = dateFormat || Config.defaultConfig.dateFormat
    this.functionArgSeparator = functionArgSeparator || Config.defaultConfig.functionArgSeparator
    this.language = language || Config.defaultConfig.language
    this.functionPlugins = functionPlugins || Config.defaultConfig.functionPlugins
    this.gpuMode = gpuMode || Config.defaultConfig.gpuMode
  }
}
