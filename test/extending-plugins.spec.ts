import {Config} from '../src/Config'
import {HandsOnEngine} from '../src'
import {FunctionPlugin, PluginFunctionType} from "../src/interpreter/FunctionPlugin";

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'foo': {
      'EN': 'foo',
      'PL': 'fu',
    }
  }

  public foo: PluginFunctionType = (ast, formulaAdress) => {
    return 42
  }
}

describe('Plugins', () => {
  it('Extending with a plugin', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=foo()'],
    ], new Config({functionPlugins: [FooPlugin]}))

    expect(engine.getCellValue('A1')).toBe(42)
  })

  it('using translation', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=fu()'],
    ], new Config({functionPlugins: [FooPlugin], language: 'PL'}))

    expect(engine.getCellValue('A1')).toBe(42)
  })
})
