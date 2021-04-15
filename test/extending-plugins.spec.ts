import {ErrorType, HyperFormula} from '../src'
import {SimpleCellAddress} from '../src/Cell'
import {ErrorMessage} from '../src/error-message'
import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {adr, detailedError} from './testUtils'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
    },
  }

  public foo(_ast: ProcedureAst, _formulaAddress: SimpleCellAddress) {
    return 42
  }
}


describe('Plugins', () => {
  it('Extending with a plugin', () => {
    HyperFormula.getLanguage('enGB').extendFunctions({'FOO': 'FOO'})
    const engine = HyperFormula.buildFromArray([
      ['=foo()'],
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toBe(42)
  })

  it('cleanup', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo()'],
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOO')))
  })
})
