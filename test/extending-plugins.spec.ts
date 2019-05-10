import {HandsOnEngine} from '../src'
import {Config} from '../src/Config'
import {FunctionPlugin, PluginFunctionType} from '../src/interpreter/plugin/FunctionPlugin'
import './testConfig.ts'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    foo: {
      EN: 'foo',
      PL: 'fu',
    },
  }

  public foo: PluginFunctionType = (ast, formulaAdress) => {
    return 42
  }
}

describe('Plugins', () => {
  it('Extending with a plugin', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=foo()'],
    ], new Config({functionPlugins: [FooPlugin]}))

    expect(engine.getCellValue('A1')).toBe(42)
  })

  it('using translation', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=fu()'],
    ], new Config({functionPlugins: [FooPlugin], language: 'PL'}))

    expect(engine.getCellValue('A1')).toBe(42)
  })
})
