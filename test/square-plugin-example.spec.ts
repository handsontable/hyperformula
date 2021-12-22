import {HyperFormula} from '../src'
import {CellError, ErrorType} from '../src/Cell'
import {InterpreterState} from '../src/interpreter/InterpreterState'
import {InternalScalarValue} from '../src/interpreter/InterpreterValue'
import {FunctionPlugin, FunctionPluginTypecheck} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import {adr, detailedError} from './testUtils'

class SquarePlugin extends FunctionPlugin implements FunctionPluginTypecheck<SquarePlugin> {
  public static implementedFunctions = {
    // Key of the mapping describes which function will be used to compute it
    'SQUARE': {
      method: 'square',
    },
  }

  public square(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    // Take ast of first argument from list of arguments
    const arg = ast.args[0]

    // If there was no argument, return NA error
    if (!arg) {
      return new CellError(ErrorType.NA)
    }

    // Compute value of argument
    const argValue = this.evaluateAst(arg, state)

    if (argValue instanceof CellError) {
      // If the value is some error, return that error
      return argValue
    } else if (typeof argValue === 'number') {
      // If it's a number, compute the result
      return (argValue * argValue)
    } else {
      // If it's some other type which doesn't make sense in terms of square (string, boolean), return VALUE error
      return new CellError(ErrorType.VALUE)
    }
  }
}

describe('Documentation example spec', () => {
  beforeEach(() => {
    HyperFormula.registerFunctionPlugin(SquarePlugin)
  })

  it('works', () => {
    HyperFormula.getLanguage('enGB').extendFunctions({SQUARE: 'SQUARE'})
    const [engine] = HyperFormula.buildFromArray([
      ['=SQUARE(2)'],
      ['=SQUARE()'],
      ['=SQUARE(TRUE())'],
      ['=SQUARE(1/0)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
