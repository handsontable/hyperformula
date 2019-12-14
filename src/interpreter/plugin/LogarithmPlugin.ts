import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'

export class LogarithmPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    log10: {
      translationKey: 'LOG10',
    },
    ln: {
      translationKey: 'LN',
    },
  }

  public log10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      if (arg > 0) {
        return Math.log10(arg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public ln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      if (arg > 0) {
        return Math.log(arg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  private templateWithOneCoercedToNumberArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (arg: number) => CellValue): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const coercedArg = coerceScalarToNumber(arg)
    if (coercedArg instanceof CellError) {
      return coercedArg
    } else {
      return fn(coercedArg)
    }
  }
}
