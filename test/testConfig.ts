import {Config} from '../src'
import {AlwaysSparse} from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {enGB} from '../src/i18n'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  dateFormat: 'MM/DD/YYYY',
  functionArgSeparator: ',',
  language: enGB,
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
})
