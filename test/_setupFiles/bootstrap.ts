/**
 * This script file presents you the opportunity of running some code immediately
 * after the test framework has been installed in the environment.
 */
import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {enGB} from '../../src/i18n/languages'
import * as plugins from '../../src/interpreter/plugin'
import {unregisterAllLanguages} from '../testUtils'
import {toContainEqualMatcher, toEqualErrorMatcher, toMatchObjectMatcher} from './matchers'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  functionPlugins: [],
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
    (jasmine as any).setDefaultSpyStrategy((and: any) => and.callThrough())
  }

  unregisterAllLanguages()

  const defaultLanguage = Config.defaultConfig.language

  HyperFormula.registerLanguage(defaultLanguage, enGB)

  HyperFormula.unregisterAllFunctions()

  for (const pluginName of Object.getOwnPropertyNames(plugins)) {
    if (!pluginName.startsWith('_')) {
      HyperFormula.registerFunctionPlugin(plugins[pluginName as keyof typeof plugins])
    }
  }
})

beforeAll(() => {
  if (!jestPresent) {
    (jasmine as any).addMatchers({
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
