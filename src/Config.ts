import {GPUInternalMode, GPUMode} from 'gpu.js'
import {ErrorType} from './Cell'
import {DateHelper, defaultParseDate, SimpleDate} from './DateHelper'
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

type PossibleGPUMode = GPUMode | GPUInternalMode

export interface ConfigParams {
  caseSensitive: boolean,
  chooseAddressMappingPolicy: ChooseAddressMapping,
  dateFormats: string[],
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  language: TranslationPackage,
  functionPlugins: any[],
  gpuMode: PossibleGPUMode,
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

export class Config implements ParserConfig {

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
  /*
   * Specifies if the string comparison is case-sensitive or not. 
   *
   * @default false
   */
  public readonly caseSensitive: boolean
  /*
  * Determines which address mapping policy will be used. Built in implementations:
  *
  * DenseSparseChooseBasedOnThreshold - will choose address mapping for each sheet separately based on fill ratio.
  * 
  * AlwaysDense - will use DenseStrategy for all sheets.
  * 
  * AlwaysSparse - will use SparseStrategy for all sheets.
  * 
  *  @default AlwaysDense
  * */
  public readonly chooseAddressMappingPolicy: ChooseAddressMapping
  /*
   * A list of date formats that are supported by date parsing functions.
   *
   * @default ['MM/DD/YYYY', 'MM/DD/YY']
   */
  public readonly dateFormats: string[]
  /*
  * A separator character used to separate arguments of procedures in formulas. Must be different from decimalSeparator.
  *
  * @default a coma - ','
  * */
  public readonly functionArgSeparator: string
  /*
  * A decimal separator used for parsing numeric literals. Must be different from functionArgSeparator.
  *
  * @default a full stop - '.'
  * */
  public readonly decimalSeparator: '.' | ','
  /*
  * Translation package with translations of function and error names.
  * @default enGB
  * */
  public readonly language: TranslationPackage
  /*
  * A list of additional function plugins to use by formula interpreter.
  *
  * @default []
  * */
  public readonly functionPlugins: any[]
  /*
  * Allows to set GPU or CPU for use in matrix calculations.
  *
  * When set to 'gpu' it will try to use GPU for matrix calculations. Setting it to 'cpu' will force CPU usage.
  *
  * Other values should be used for debugging purposes only. More info can be found in GPU.js documentation.
  * 
  * @default 'gpu'
  * */
  public readonly gpuMode: PossibleGPUMode
  /*
   * Preserves an option for setting 1900 as a leap year.
   *
   * 1900 was not a leap year, but in Lotus 1-2-3 it was faulty interpreted as a leap year.
   * 
   * This error was inherited by the Excel, and we have this option for compatibility
   * 
   * @default false
   */
  public readonly leapYear1900: boolean
  /*
  * Enables numeric matrix detection feature when set to 'true'.
  *
  * During build phase each rectangular area of numbers will be treated as one matrix vertex in order to optimize further calculations.
  * 
  * Some CRUD operations may break numeric matrices into individual vertices if needed.
  * 
  * @default true
  * */
  public readonly matrixDetection: boolean
  /*
  * Specifies how many cells an area must have in order to be treated as a matrix. Relevant only if matrixDetection is set to true.
  * 
  * @default 100
  * */
  public readonly matrixDetectionThreshold: number
  /*
   * Two-digit values when interpreted as a year can be either 19xx or 20xx.
   *
   * If xx<=nullYear its latter, otherwise its former.
   * 
   * @default 30
   */
  public readonly nullYear: number
  /*
   * Allows to provide a function that takes a string representing date and parses it into an actual date.
   *
   * @default built-in default function for date parsing
   */
  public readonly parseDate: (dateString: string, dateFormats: string[], dateHelper: DateHelper) => SimpleDate | null
  /*
   * Allows to provide a function that takes date (represented as a number) and prints it into string.
   *
   * @default built-in function for stringifying dates
   */
  public readonly stringifyDate: (value: number, formatArg: string, dateHelper: DateHelper) => string | null
  /*
   * precisionEpsilon controls how far two numerical values need to be from each other to be treated as non-equal.
   *
   * a and b are equal if they are of the same sign and:
   * 
   * abs(a) <= (1+precisionEpsilon) * abs(b)
   * 
   * and
   * 
   * abs(b) <= (1+precisionEpsilon) * abs(a)
   *
   * It also controls snap-to-zero behavior for additions/subtractions:
   * 
   * for c=a+b or c=a-b, if abs(c) <= precisionEpsilon * abs(a), then c is set to 0
   * 
   * @default 1e-13
   */
  public readonly precisionEpsilon: number
  /*
   * Sets how precise the calculation should be.
   *
   * Numerical outputs are rounded to `precisionRounding` many digits after the decimal.
   * 
   * @default 14
   */
  public readonly precisionRounding: number
  /*
   * Sets the rounding.
   *
   * If false, no rounding happens, and numbers are equal if and only if they are truly identical value (see: precisionEpsilon).
   * 
   * @default true
   */
  public readonly smartRounding: boolean
  /*
  * Switches column search strategy from binary search to column index. 
  *
  * Used by VLOOKUP and MATCH procedures.
  * 
  * Using column index may improve time efficiency but it will increase memory usage. 
  * 
  * In some scenarios column index may fall back to binary search despite of this flag.
  * 
  * @default false
  * */
  public readonly useColumnIndex: boolean
  /*
  * Determines minimum number of elements a range must have in order to use binary search. 
  *
  * Shorter ranges will be searched naively.
  * 
  * Used by VLOOKUP and MATCH procedures.
  * 
  * @default 20
  * */
  public readonly vlookupThreshold: number
  /*
   * Allows to set a specific date from which the number of days will be counted.
   *
   * Dates are represented internally as number of days that passed since this nullDate.
   * 
   * Set to {year: 1899, month: 12, day: 30} as default.
   */
  public readonly nullDate: SimpleDate
  /*
  * Built automatically based on translation package.
  * */
  public readonly errorMapping: Record<string, ErrorType>


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
    this.caseSensitive = typeof caseSensitive === 'boolean' ? caseSensitive : Config.defaultConfig.caseSensitive
    this.chooseAddressMappingPolicy = chooseAddressMappingPolicy || Config.defaultConfig.chooseAddressMappingPolicy
    this.dateFormats = typeof dateFormats === 'undefined' ? Config.defaultConfig.dateFormats : dateFormats
    this.functionArgSeparator = functionArgSeparator || Config.defaultConfig.functionArgSeparator
    this.decimalSeparator = decimalSeparator || Config.defaultConfig.decimalSeparator
    this.language = language || Config.defaultConfig.language
    this.functionPlugins = functionPlugins || Config.defaultConfig.functionPlugins
    this.gpuMode = gpuMode || Config.defaultConfig.gpuMode
    this.smartRounding = typeof smartRounding === 'boolean' ? smartRounding : Config.defaultConfig.smartRounding
    this.matrixDetection = typeof matrixDetection === 'boolean' ? matrixDetection : Config.defaultConfig.matrixDetection
    this.matrixDetectionThreshold = typeof matrixDetectionThreshold === 'number' ? matrixDetectionThreshold : Config.defaultConfig.matrixDetectionThreshold
    this.nullYear = typeof nullYear === 'number' ? nullYear : Config.defaultConfig.nullYear
    this.precisionRounding = typeof precisionRounding === 'number' ? precisionRounding : Config.defaultConfig.precisionRounding
    this.precisionEpsilon = typeof precisionEpsilon === 'number' ? precisionEpsilon : Config.defaultConfig.precisionEpsilon
    if (!this.smartRounding) {
      this.precisionEpsilon = 0
    }
    this.useColumnIndex = typeof useColumnIndex === 'boolean' ? useColumnIndex : Config.defaultConfig.useColumnIndex
    this.vlookupThreshold = typeof vlookupThreshold === 'number' ? vlookupThreshold : Config.defaultConfig.vlookupThreshold
    this.errorMapping = this.buildErrorMapping(this.language)
    this.parseDate = typeof parseDate === 'function' ? parseDate : Config.defaultConfig.parseDate
    this.stringifyDate = typeof stringifyDate === 'function' ? stringifyDate : Config.defaultConfig.stringifyDate
    this.nullDate = typeof nullDate === 'undefined' ? Config.defaultConfig.nullDate : nullDate
    this.leapYear1900 = typeof leapYear1900 === 'boolean' ? leapYear1900 : Config.defaultConfig.leapYear1900

    if (this.decimalSeparator === this.functionArgSeparator) {
      throw Error('Config initialization failed. Function argument separator and decimal separator needs to differ.')
    }
    if (this.decimalSeparator !== '.' && this.decimalSeparator !== ',') {
      throw Error('Config initialization failed. Decimal separator can take \'.\' or \',\' as a value.')
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
}
