import {CellError, ErrorType, HyperFormula} from '../src'
import {SimpleCellAddress} from '../src/Cell'
import {coerceScalarToString} from '../src/interpreter/ArithmeticHelper'
import {SimpleRangeValue} from '../src/interpreter/InterpreterValue'
import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {AstNodeType, ProcedureAst} from '../src/parser'
import {adr, detailedError} from './testUtils'

class FooPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    foo: {
      translationKey: 'FOO',
    },
  }

  public foo(ast: ProcedureAst, formulaAddress: SimpleCellAddress) {
    if (ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    const arg1 = ast.args[0].type !== AstNodeType.EMPTY ? this.evaluateAst(ast.args[0], formulaAddress) : 'default1'
    if (arg1 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const arg2 = ast.args[1].type !== AstNodeType.EMPTY ? this.evaluateAst(ast.args[1], formulaAddress) : 'default2'
    if (arg2 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedArg1 = coerceScalarToString(arg1)
    if (coercedArg1 instanceof CellError)  {
      return coercedArg1
    }
    const coercedArg2 = coerceScalarToString(arg2)
    if (coercedArg2 instanceof CellError) {
      return coercedArg2
    }
    return coercedArg1 + '+' + coercedArg2
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
    ], {functionPlugins: [FooPlugin]})

    expect(engine.getCellValue(adr('A1'))).toBe('1+2')
    expect(engine.getCellValue(adr('A2'))).toBe('default1+2')
    expect(engine.getCellValue(adr('A3'))).toBe('default1+2')
    expect(engine.getCellValue(adr('A4'))).toBe('1+default2')
    expect(engine.getCellValue(adr('A5'))).toBe('default1+default2')
  })

  it('typical function do not accept', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE(,1,1900)'],
      ['=LOG(10,)'],
      ['=SUM(,1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('serializes with whitespace+optional parameters', () => {
    const engine = HyperFormula.buildFromArray([
      ['=DATE( ,1,1900)'],
      ['=LOG(10, )'],
      ['=SUM( ,1)'],
      ['=PI( )']
    ])
    expect(engine.getCellFormula(adr('A1'))).toEqual('=DATE( ,1,1900)')
    expect(engine.getCellFormula(adr('A2'))).toEqual('=LOG(10, )')
    expect(engine.getCellFormula(adr('A3'))).toEqual('=SUM( ,1)')
    expect(engine.getCellFormula(adr('A4'))).toEqual('=PI( )')
  })
})
