import {CellError, InternalCellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    log10: {
      translationKey: 'LOG10',
    },
    log: {
      translationKey: 'LOG',
    },
    ln: {
      translationKey: 'LN',
    },
  }

  public log10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      if (arg > 0) {
        return Math.log10(arg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public log(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    } else {
      const arg = this.evaluateAst(ast.args[0], formulaAddress)
      if (arg instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      let coercedLogarithmicBase
      if (ast.args[1]) {
        const logarithmicBase = this.evaluateAst(ast.args[1], formulaAddress)
        if (logarithmicBase instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        coercedLogarithmicBase = coerceScalarToNumber(logarithmicBase, this.interpreter.dateHelper)
      } else {
        coercedLogarithmicBase = 10
      }

      const coercedArg = coerceScalarToNumber(arg, this.interpreter.dateHelper)
      if (coercedArg instanceof CellError) {
        return coercedArg
      } else if (coercedLogarithmicBase instanceof CellError) {
        return coercedLogarithmicBase
      } else {
        if (coercedArg > 0 && coercedLogarithmicBase > 0) {
          return (Math.log(coercedArg) / Math.log(coercedLogarithmicBase))
        } else {
          return new CellError(ErrorType.NUM)
        }
      }
    }
  }

  public ln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      if (arg > 0) {
        return Math.log(arg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }
}
