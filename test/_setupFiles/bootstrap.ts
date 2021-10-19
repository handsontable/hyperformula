/**
 * This script file presents you the opportunity of running some code immediately
 * after the test framework has been installed in the environment.
 */
import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {enGB} from '../../src/i18n/languages'
import * as plugins from '../../src/interpreter/plugin'
import {unregisterAllLanguages} from './../testUtils'
import {toContainEqualMatcher, toEqualErrorMatcher, toMatchObjectMatcher} from './matchers'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  functionPlugins: [],
  gpuMode: 'cpu',
  useStats: true,
  licenseKey: 'gpl-v3',
})

const jestPresent = (() => {
  try {
    expect([{a: 0}]).toContainEqual({a: 0})
    return true
  } catch (e) {
    return false
  }
})()

beforeEach(() => {
  if (!jestPresent) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    jasmine.setDefaultSpyStrategy((and: unknown) => and.callThrough())
  }

  unregisterAllLanguages()

  const defaultLanguage = Config.defaultConfig.language

  HyperFormula.registerLanguage(defaultLanguage, enGB)

  HyperFormula.unregisterAllFunctions()

  for (const pluginName of Object.getOwnPropertyNames(plugins)) {
    if (!pluginName.startsWith('_')) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      HyperFormula.registerFunctionPlugin(plugins[pluginName])
    }
  }
})

beforeAll(() => {
  if (!jestPresent) {
    jasmine.addMatchers({
      ...toContainEqualMatcher,
      ...toMatchObjectMatcher,
      ...toEqualErrorMatcher,
    })
  } else {
    if (global.gc) {
      global.gc()
    }
  }
})
