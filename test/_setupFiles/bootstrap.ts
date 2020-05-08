/**
 * This script file presents you the opportunity of running some code immediately
 * after the test framework has been installed in the environment.
 */
import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {languages} from '../../src/i18n'
import {unregisterAllLanguages} from './../testUtils'

import {
  toContainEqualMatcher,
  toMatchObjectMatcher,
} from './matchers'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
  useStats: true,
  licenseKey: 'agpl-v3',
})

beforeEach(() => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    jasmine.setDefaultSpyStrategy((and: unknown) => and.callThrough())
  } catch (e) {}

  unregisterAllLanguages()

  const defaultLanguage = Config.defaultConfig.language

  HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])
})

beforeAll(() => {
  // jasmine.addMatchers({
  //   ...toContainEqualMatcher,
  //   ...toMatchObjectMatcher,
  // })
  try {
    expect([{a: 0}]).toContainEqual({a:0})
  } catch (e) {
    jasmine.addMatchers({
      ...toContainEqualMatcher,
      ...toMatchObjectMatcher,
    })
  }
})
