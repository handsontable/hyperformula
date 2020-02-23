import {HyperFormula} from '../src'
import {Config} from '../src'
import {enGB, extendFunctions} from '../src/i18n'
import {FunctionPlugin, PluginFunctionType} from '../src/interpreter/plugin/FunctionPlugin'
import './testConfig.ts'
import {adr} from './testUtils'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    foo: {
      translationKey: 'FOO',
    },
  }

  public foo: PluginFunctionType = () => {
    return 42
  }
}

describe('Plugins', () => {
  it('Extending with a plugin',  () => {
    const enGBextended = extendFunctions(enGB, {
      FOO: 'FOO',
    })
    const engine = HyperFormula.buildFromArray([
      ['=foo()'],
    ], new Config({functionPlugins: [FooPlugin], language: enGBextended}))

    expect(engine.getCellValue(adr('A1'))).toBe(42)
  })
})
