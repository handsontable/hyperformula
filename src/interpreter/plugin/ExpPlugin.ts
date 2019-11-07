import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {SimpleRangeValue} from '../InterpreterValue'
import {coerceScalarToNumber} from '../coerce'

export class ExpPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    exp: {
      translationKey: 'EXP',
    },
  }

  /**
   * Corresponds to EXP(value)
   *
   * Calculates the exponent for basis e
   *
   * @param ast
   * @param formulaAddress
   */
  public exp(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    } else {
      const arg = this.evaluateAst(ast.args[0], formulaAddress)
      if (arg instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      const coercedValue = coerceScalarToNumber(arg)
      if (coercedValue instanceof CellError) {
        return coercedValue
      } else {
        return Math.exp(coercedValue)
      }
    }
  }
}
