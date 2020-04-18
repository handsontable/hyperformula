import {ErrorType, HyperFormula} from '../src'
import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {adr, detailedError} from './testUtils'
import {ProcedureAst} from '../src/parser'
import {SimpleCellAddress} from '../src/Cell'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    foo: {
      translationKey: 'FOO',
    },
  }

  public foo(_ast: ProcedureAst, _formulaAddress: SimpleCellAddress) {
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
  })

  it('cleanup',  () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo()'],
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NAME))
  })
})
