import {HyperFormula} from '../src'
import {Config} from '../src'
import {CellError, ErrorType, SimpleCellAddress} from '../src/Cell'
import {enGB, extendFunctions} from '../src/i18n'
import {FunctionPlugin} from '../src/interpreter/plugin/FunctionPlugin'
import {ProcedureAst} from '../src/parser'
import './testConfig.ts'

class SquarePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    // Key of the mapping describes which function will be used to compute it
    square: {
      translationKey: 'SQUARE',
    },
  }

  public square(ast: ProcedureAst, formulaAddress: SimpleCellAddress) {
    // Take ast of first argument from list of arguments
    const arg = ast.args[0]

    // If there was no argument, return NA error
    if (!arg) {
      return new CellError(ErrorType.NA)
    }

    // Compute value of argument
    const argValue = this.evaluateAst(arg, formulaAddress)

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
  it('works', () => {
    const enGBextended = extendFunctions(enGB, {
      SQUARE: 'SQUARE',
    })
    const config = new Config({ functionPlugins: [SquarePlugin], language: enGBextended })
    const engine = HyperFormula.buildFromArray([
      ['=SQUARE(2)'],
      ['=SQUARE()'],
      ['=SQUARE(TRUE())'],
      ['=SQUARE(1/0)'],
    ], config)
    expect(engine.getCellValue('A1')).toEqual(4)
    expect(engine.getCellValue('A2')).toEqual(new CellError(ErrorType.NA))
    expect(engine.getCellValue('A3')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('A4')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })
})
