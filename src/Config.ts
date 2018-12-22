export class Config {
  public static readonly CSV_DELIMITER = ','
  public static readonly FUNCTION_ARG_SEPARATOR = ','

  public static readonly ADDRESS_MAPPING_FILL_THRESHOLD = 0.8

  public static readonly LANGUAGE = 'EN'
  public static readonly DATE_FORMAT = 'MM/DD/YYYY'

  constructor({
    public readonly csvDelimiter,
    public readonly functionArgSeparator,
    public readonly addressMappingFillThreshold,
    public readonly language,
    public readonly dateFormat,
  })
}
