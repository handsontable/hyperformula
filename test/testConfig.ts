import sinon from 'sinon'
import {HyperFormula} from '../src'
import {Config} from '../src/Config'
import {AlwaysSparse} from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {languages} from '../src/i18n'
import {unregisterAllLanguages} from './testUtils'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
  useStats: true
})

beforeEach(() => {
  unregisterAllLanguages()
  const defaultLanguage = Config.defaultConfig.language
  HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])
})

afterEach(() => {
  sinon.restore()
})
