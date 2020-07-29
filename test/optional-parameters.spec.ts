import {ErrorType, HyperFormula} from '../src'
import {CellError, SimpleCellAddress} from '../src/Cell'
import {coerceScalarToString} from '../src/interpreter/ArithmeticHelper'
import {SimpleRangeValue} from '../src/interpreter/InterpreterValue'
import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {AstNodeType, ProcedureAst} from '../src/parser'
import {adr, detailedError} from './testUtils'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FOO': {
      method: 'foo',
      parameters: {
        list: [
          { argumentType: 'string', defaultValue: 'default1'},
          { argumentType: 'string', defaultValue: 'default2'},
        ],
      },
    },
  }

  public foo(ast: ProcedureAst, formulaAddress: SimpleCellAddress) {
    return this.runFunction(ast.args, formulaAddress, this.parameters('FOO'),
      (arg1, arg2) => arg1+'+'+arg2
    )
  }
}

describe('Nonexistent parameters', () => {
  it('should work for function', () => {
    HyperFormula.getLanguage('enGB').extendFunctions({FOO: 'FOO'})
    const engine = HyperFormula.buildFromArray([
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
    const engine = HyperFormula.buildFromArray([
      ['=LOG(10,)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('other function coerce EmptyValue', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(,1,1900)'],
      ['=SUM(,1)'],
      ['=CONCATENATE(,"abcd")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1901)
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM)) //TODO when SUM() is fixed, it should evaluate to 1
    expect(engine.getCellValue(adr('A3'))).toEqual('abcd')
  })


})
