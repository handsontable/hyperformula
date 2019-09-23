import {Config} from '../src/Config'
import {enGB} from '../src/i18n'
import {AlwaysSparse} from '../src/DependencyGraph/ChooseAddressMappingPolicy'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  dateFormat: 'MM/DD/YYYY',
  functionArgSeparator: ',',
  language: enGB,
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
})
