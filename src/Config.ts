export class Config {
  public static readonly CSV_DELIMITER = ','
  public static readonly FUNCTION_ARG_SEPARATOR = ','

  public static readonly ADDRESS_MAPPING_FILL_THRESHOLD = 0.8

  public static readonly LANGUAGE = 'EN'

  public readonly addressMappingFillThreshold: number
  public readonly csvDelimiter: string
  public readonly functionArgSeparator: string
  public readonly language: string
  public readonly functionPlugins: any[]

  constructor({
    addressMappingFillThreshold,
    csvDelimiter,
    functionArgSeparator,
    language,
    functionPlugins,
  }: {
    addressMappingFillThreshold?: number,
    csvDelimiter?: string,
    functionArgSeparator?: string,
    language?: string,
    functionPlugins?: any[],
  } = {}) {
    this.addressMappingFillThreshold = addressMappingFillThreshold || Config.ADDRESS_MAPPING_FILL_THRESHOLD
    this.csvDelimiter = csvDelimiter || Config.CSV_DELIMITER
    this.functionArgSeparator = functionArgSeparator || Config.FUNCTION_ARG_SEPARATOR
    this.language = language || Config.LANGUAGE
    this.functionPlugins = functionPlugins || []
  }
}
