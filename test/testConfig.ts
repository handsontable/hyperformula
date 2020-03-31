import {HyperFormula} from '../src'
import {Config} from '../src/Config'
import {AlwaysSparse} from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {enGB} from '../src/i18n'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  dateFormats: ['MM/DD/YYYY'],
  functionArgSeparator: ',',
  language: 'enGB',
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
  useStats: true
})

beforeEach(() => {
  HyperFormula.unregisterAllLanguages()
  HyperFormula.registerLanguage('enGB', enGB);
})
