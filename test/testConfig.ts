import {Config} from '../src'
import {AlwaysPlusTree} from '../src/DependencyGraph/ChooseAddressMappingPolicy'
import {enGB} from '../src/i18n'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysPlusTree(),
  dateFormat: 'MM/DD/YYYY',
  functionArgSeparator: ',',
  language: enGB,
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
})
