import {Config} from '../src/Config'
import {AlwaysSparse} from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'

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
