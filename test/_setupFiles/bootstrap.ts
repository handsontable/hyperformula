/**
 * This script file presents you the opportunity of running some code immediately
 * after the test framework has been installed in the environment.
 */
import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {languages} from '../../src/i18n'
import {unregisterAllFormulas, unregisterAllLanguages} from './../testUtils'
import {toContainEqualMatcher, toMatchObjectMatcher} from './matchers'
import * as plugins from '../../src/interpreter/plugin'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
  useStats: true,
  licenseKey: 'agpl-v3',
})

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  jasmine.setDefaultSpyStrategy((and: unknown) => and.callThrough())

  unregisterAllLanguages()

  const defaultLanguage = Config.defaultConfig.language

  HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])

  unregisterAllFormulas()
  for (const plugin of Object.values(plugins)) {
    HyperFormula.registerFunctionPlugin(plugin)
  }
})

beforeAll(() => {
  jasmine.addMatchers({
    ...toContainEqualMatcher,
    ...toMatchObjectMatcher,
  })
})
