import {Config} from '../src/Config'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  addressMappingFillThreshold: 1,
  csvDelimiter: ',',
  dateFormat: 'MM/DD/YYYY',
  functionArgSeparator: ',',
  language: 'EN',
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
})
