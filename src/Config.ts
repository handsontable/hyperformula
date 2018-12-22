export class Config {
  public static readonly CSV_DELIMITER = ','
  public static readonly FUNCTION_ARG_SEPARATOR = ','

  public static readonly ADDRESS_MAPPING_FILL_THRESHOLD = 0.8

  public static readonly LANGUAGE = 'EN'
  public static readonly DATE_FORMAT = 'MM/DD/YYYY'

  public readonly addressMappingFillThreshold: number
  public readonly csvDelimiter: string
  public readonly dateFormat: string
  public readonly functionArgSeparator: string
  public readonly language: string

  constructor({
    addressMappingFillThreshold,
    csvDelimiter,
    dateFormat,
    functionArgSeparator,
    language,
  }: {
    addressMappingFillThreshold?: number,
    csvDelimiter?: string,
    dateFormat?: string,
    functionArgSeparator?: string,
    language?: string,
  } = {}) {
    this.addressMappingFillThreshold = addressMappingFillThreshold || Config.ADDRESS_MAPPING_FILL_THRESHOLD
    this.csvDelimiter = csvDelimiter || Config.CSV_DELIMITER
    this.dateFormat = dateFormat || Config.DATE_FORMAT
    this.functionArgSeparator = functionArgSeparator || Config.FUNCTION_ARG_SEPARATOR
    this.language = language || Config.LANGUAGE
  }
}
