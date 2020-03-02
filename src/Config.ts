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
   * whether string comparison is case-sensitive or not
   */
  public readonly caseSensitive: boolean
  /*
  * determines which addess mapping policy will be used. Built in implementations:
  * DenseSparseChooseBasedOnThreshold - will choose address mapping for each sheet separately based on fill ratio.
  * AlwaysDense - will use DenseStrategy for all sheets
  * AlwaysSparse - will use SparseStrategy for all sheets
  * */
  public readonly chooseAddressMappingPolicy: ChooseAddressMapping
  /*
   * list of date formats that are supported by date parsing functions
   */
  public readonly dateFormats: string[]
  /*
  * separator character used to separate arguments of procedures in formulas. Must be different from decimalSeparator.
  * */
  public readonly functionArgSeparator: string
  /*
  * decimal separator used for parsing numeric literals. Must be different from functionArgSeparator.
  * */
  public readonly decimalSeparator: '.' | ','
  /*
  * translation package with translations of function and error names.
  * */
  public readonly language: TranslationPackage
  /*
  * list of additional function plugins to use by formula interpreter.
  * */
  public readonly functionPlugins: any[]
  /*
  * when set to 'gpu' (by default) it will try to use GPU for matrix calculations. Setting it to 'cpu' will force CPU usage.
  * Other values should be used for debugging purposes only. More info can be found in GPU.js documentation.
  * */
  public readonly gpuMode: PossibleGPUMode
  /*
   * year 1900 was not leap, but in lotus 1-2-3 it was faulty interpreted as leap.
   * this error was inherited by excel, and we have this option for compatibility
   */
  public readonly leapYear1900: boolean
  /*
  * enables numeric matrix detection feature when set to 'true'.
  * During build phase each rectangular area of numbers will be treated as one matrix vertex in order to optimize further calculations.
  * Some CRUD operations may break numeric matrices into individual vertices if needed.
  * */
  public readonly matrixDetection: boolean
  /*
  * specifies how many cells an area must have in order to be treated as matrix. Relevant only if matrixDetection is set to true.
  * */
  public readonly matrixDetectionThreshold: number
  /*
   * two-digit values when interpreted as year can be either 19xx or 20xx. If xx<=nullYear its latter, otherwise its former.
   */
  public readonly nullYear: number
  /*
   * function that takes string representing date and parses it into actual date
   */
  public readonly parseDate: (dateString: string, dateFormats: string[], dateHelper: DateHelper) => SimpleDate | null
  /*
   * function that takes date (represented as a number) and prints it into string
   */
  public readonly stringifyDate: (value: number, formatArg: string, dateHelper: DateHelper) => string | null
  /*
   * precisionEpsilon controls how far two numerical values need to be from each other so we treat them as non-equal
   * a and b are equal if they are of the same sign and:
   * abs(a) <= (1+precisionEpsilon) * abs(b)
   * and
   * abs(b) <= (1+precisionEpsilon) * abs(a)
   *
   * it also controls snap-to-zero behaviour for additions/subtractions:
   * for c=a+b or c=a-b, if abs(c) <= precisionEpsilon * abs(a), then c is set to 0
   */
  public readonly precisionEpsilon: number
  /*
   * numerical outputs are rounded to precisionRounding many digits after decimal
   */
  public readonly precisionRounding: number
  /*
   * if false, no rounding happens, and numbers are equal if and only if they are truly identical value (see: precisionEpsilon)
   */
  public readonly smartRounding: boolean
  /*
  * switches column search strategy from binary search to column index. Used by VLOOKUP and MATCH procedures.
  * Using column index may improve time efficency but it will increase memory usage. In some scenarios column index may fall back to binary search
  * despite of this flag.
  * */
  public readonly useColumnIndex: boolean
  /*
  * determines minimum number of elements a range must have in order to use binary search. Shorter ranges will be searched naively.
  * Used by VLOOKUP and MATCH procedures.
  * */
  public readonly vlookupThreshold: number
  /*
   * dates are represented internally as number of days that passed since nullDate
   */
  public readonly nullDate: SimpleDate
  /*
  * built automatically based on translation package.
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
