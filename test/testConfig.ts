import {Config} from '../src/Config'
import {enGB} from '../src/i18n'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  addressMappingFillThreshold: 1,
  dateFormat: 'MM/DD/YYYY',
  functionArgSeparator: ',',
  language: enGB,
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
})
