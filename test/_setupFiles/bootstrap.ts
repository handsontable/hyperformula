/**
 * This script file presents you the opportunity of running some code immediately
 * after the test framework has been installed in the environment.
 */
import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {languages} from '../../src/i18n'
import {unregisterAllLanguages} from './../testUtils'
import {SumifPlugin} from '../../src/interpreter/plugin/SumifPlugin'
import {TextPlugin} from '../../src/interpreter/plugin/TextPlugin'
import {NumericAggregationPlugin} from '../../src/interpreter/plugin/NumericAggregationPlugin'
import {MedianPlugin} from '../../src/interpreter/plugin/MedianPlugin'
import {DatePlugin} from '../../src/interpreter/plugin/DatePlugin'
import {BooleanPlugin} from '../../src/interpreter/plugin/BooleanPlugin'
import {InformationPlugin} from '../../src/interpreter/plugin/InformationPlugin'
import {TrigonometryPlugin} from '../../src/interpreter/plugin/TrigonometryPlugin'
import {CountUniquePlugin} from '../../src/interpreter/plugin/CountUniquePlugin'
import {SumprodPlugin} from '../../src/interpreter/plugin/SumprodPlugin'
import {MatrixPlugin} from '../../src/interpreter/plugin/MatrixPlugin'
import {ExpPlugin} from '../../src/interpreter/plugin/ExpPlugin'
import {AbsPlugin} from '../../src/interpreter/plugin/AbsPlugin'
import {DegreesPlugin} from '../../src/interpreter/plugin/DegreesPlugin'
import {RadiansPlugin} from '../../src/interpreter/plugin/RadiansPlugin'
import {RandomPlugin} from '../../src/interpreter/plugin/RandomPlugin'
import {VlookupPlugin} from '../../src/interpreter/plugin/VlookupPlugin'
import {IsEvenPlugin} from '../../src/interpreter/plugin/IsEvenPlugin'
import {IsOddPlugin} from '../../src/interpreter/plugin/IsOddPlugin'
import {RoundingPlugin} from '../../src/interpreter/plugin/RoundingPlugin'
import {RadixConversionPlugin} from '../../src/interpreter/plugin/RadixConversionPlugin'
import {LogarithmPlugin} from '../../src/interpreter/plugin/LogarithmPlugin'
import {BitwiseLogicOperationsPlugin} from '../../src/interpreter/plugin/BitwiseLogicOperationsPlugin'
import {BitShiftPlugin} from '../../src/interpreter/plugin/BitShiftPlugin'
import {PowerPlugin} from '../../src/interpreter/plugin/PowerPlugin'
import {MathConstantsPlugin} from '../../src/interpreter/plugin/MathConstantsPlugin'
import {SqrtPlugin} from '../../src/interpreter/plugin/SqrtPlugin'
import {ModuloPlugin} from '../../src/interpreter/plugin/ModuloPlugin'
import {DeltaPlugin} from '../../src/interpreter/plugin/DeltaPlugin'
import {CharPlugin} from '../../src/interpreter/plugin/CharPlugin'
import {CodePlugin} from '../../src/interpreter/plugin/CodePlugin'
import {ErrorFunctionPlugin} from '../../src/interpreter/plugin/ErrorFunctionPlugin'
import {CorrelPlugin} from '../../src/interpreter/plugin/CorrelPlugin'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
  useStats: true,
  licenseKey: 'agpl-v3',
})

beforeEach(() => {
  unregisterAllLanguages()

  const defaultLanguage = Config.defaultConfig.language

  HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])
  HyperFormula.registerFormulas(
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
  )
})
