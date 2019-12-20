import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class PowerPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    power: {
      translationKey: 'POWER',
    },
  }

  public power(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const base = this.evaluateAst(ast.args[0], formulaAddress)
    if (base instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const coercedBase = coerceScalarToNumber(base)
    if (coercedBase instanceof CellError) {
      return coercedBase
    }

    const exponent = this.evaluateAst(ast.args[1], formulaAddress)
    if (exponent instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedExponent = coerceScalarToNumber(exponent)
    if (coercedExponent instanceof CellError) {
      return coercedExponent
    }

    if (coercedBase === 0 && coercedExponent < 0) {
      return new CellError(ErrorType.NUM)
    }

    const value = Math.pow(coercedBase, coercedExponent)
    if (!Number.isFinite(value)) {
      return new CellError(ErrorType.NUM)
    } else {
      return value
    }
  }
}
