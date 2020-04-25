/**
 * This script file presents you the opportunity of running some code immediately
 * after the test framework has been installed in the environment.
 */
import {HyperFormula} from '../../src'
import {Config} from '../../src/Config'
import {AlwaysSparse} from '../../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {languages} from '../../src/i18n'
import {unregisterAllLanguages} from './../testUtils'

Config.defaultConfig = Object.assign({}, Config.defaultConfig, {
  chooseAddressMappingPolicy: new AlwaysSparse(),
  functionPlugins: [],
  gpuMode: 'cpu',
  matrixDetection: false,
  useStats: true,
  licenseKey: 'agpl-v3',
})

beforeEach(() => {
  unregisterAllLanguages()

  const defaultLanguage = Config.defaultConfig.language

  HyperFormula.registerLanguage(defaultLanguage, languages[defaultLanguage])
})

beforeAll(() => {
  jasmine.addMatchers({
    toContainEqual: function(util) {
      return {
        compare: function(actual: string|ArrayLike<unknown>, expected: unknown) {
          return {
            pass: util.contains(actual, expected),
          }
        },
      }
    },
    toMatchObject: function() {
      return {
        compare: function(actual: any, expected: any) {
          let result = false

          Object.keys(expected).forEach((key: string) => {
            result = actual[key] === expected[key]
          })

          return {
            pass: result,
          }
        },
      }
    },
    toStrictEqual: function(util) {
      return {
        compare: function(actual: unknown, expected: unknown) {
          return {
            pass: util.equals(actual, expected),
          }
        },
      }
    },
  })
})