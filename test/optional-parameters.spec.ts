import {ErrorType, HyperFormula} from '../src'
import {ErrorMessage} from '../src/error-message'
import {InterpreterState} from '../src/interpreter/InterpreterState'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {adr, detailedError} from './testUtils'

class FooPlugin extends FunctionPlugin implements FunctionPluginTypecheck<FooPlugin> {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
      parameters: [
        {argumentType: ArgumentTypes.STRING, defaultValue: 'default1'},
        {argumentType: ArgumentTypes.STRING, defaultValue: 'default2'},
      ],
    },
  }

  public foo(ast: ProcedureAst, state: InterpreterState) {
    return this.runFunction(ast.args, state, this.metadata('FOO'),
      (arg1, arg2) => arg1 + '+' + arg2
    )
  }
}

describe('Nonexistent metadata', () => {
  it('should work for function', () => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    const [engine] = HyperFormula.buildFromArray([
      ['=foo(1,2)'],
      ['=foo(,2)'],
      ['=foo( ,2)'],
      ['=foo(1,)'],
      ['=foo( , )'],
      ['=foo(1)'],
      ['=foo()'],
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toBe('1+2')
    expect(engine.getCellValue(adr('A2'))).toBe('+2')
    expect(engine.getCellValue(adr('A3'))).toBe('+2')
    expect(engine.getCellValue(adr('A4'))).toBe('1+')
    expect(engine.getCellValue(adr('A5'))).toBe('+')
    expect(engine.getCellValue(adr('A6'))).toBe('1+default2')
    expect(engine.getCellValue(adr('A7'))).toBe('default1+default2')
  })

  it('log fails with coerce to 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=LOG(10,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })

  it('other function coerce EmptyValue', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DATE(,1,1900)'],
      ['=SUM(,1)'],
      ['=CONCATENATE(,"abcd")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1901)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual('abcd')
  })

})
