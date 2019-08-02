import {HandsOnEngine} from '../src'
import {Config} from '../src/Config'
import {enGB, extendFunctions} from '../src/i18n'
import {FunctionPlugin, PluginFunctionType} from '../src/interpreter/plugin/FunctionPlugin'
import './testConfig.ts'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    foo: {
      translationKey: 'FOO',
    },
  }

  public foo: PluginFunctionType = (ast, formulaAdress) => {
    return 42
  }
}

describe('Plugins', () => {
  it('Extending with a plugin', async () => {
    const enGBextended = extendFunctions(enGB, {
      FOO: 'FOO',
    })
    const engine = HandsOnEngine.buildFromArray([
      ['=foo()'],
    ], new Config({functionPlugins: [FooPlugin], language: enGBextended}))

    expect(engine.getCellValue('A1')).toBe(42)
  })
})
