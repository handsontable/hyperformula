import {HyperFormula} from '../src'
import {enGB} from '../src/i18n'
import {ErrorType} from '../src'
import {FunctionPlugin, PluginFunctionType} from '../src/interpreter/plugin/FunctionPlugin'
import './testConfig.ts'
import {adr, detailedError} from './testUtils'

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
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    const engine = HyperFormula.buildFromArray([
      ['=foo()'],
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toBe(42)
    HyperFormula.unregisterLanguage('enGB')
    HyperFormula.registerLanguage('enGB', enGB)
  })

  it('cleanup - broken',  () => { //TODO: loading plugin automatically adds translation to plugin cache
    const engine = HyperFormula.buildFromArray([
      ['=foo()'],
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })
})
