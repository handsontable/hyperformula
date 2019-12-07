import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {SimpleRangeValue} from '../InterpreterValue'
import {coerceScalarToNumber} from '../coerce'

export class IsEvenPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    iseven: {
      translationKey: 'ISEVEN',
    },
  }

  public iseven(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
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
        return (coercedValue % 2 === 0)
      }
    }
  }
}
