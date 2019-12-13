import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'


/**
 * Interpreter plugin containing trigonometric functions
 */
export class TrigonometryPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    acos: {
      translationKey: 'ACOS',
    },
    asin: {
      translationKey: 'ASIN',
    },
    cos: {
      translationKey: 'COS',
    },
    sin: {
      translationKey: 'SIN',
    },
    tan: {
      translationKey: 'TAN',
    },
    atan: {
      translationKey: 'ATAN',
    },
    ctg: {
      translationKey: 'COT',
    },
  }

  /**
   * Corresponds to ACOS(value)
   *
   * Returns the arc cosine (or inverse cosine) of a number.
   *
   * @param ast
   * @param formulaAddress
   */
  public acos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      if (-1 <= coercedArg && coercedArg <= 1) {
        return Math.acos(coercedArg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public asin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      if (-1 <= coercedArg && coercedArg <= 1) {
        return Math.asin(coercedArg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public cos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      return Math.cos(coercedArg)
    })
  }

  public sin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      return Math.sin(coercedArg)
    })
  }

  public tan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      return Math.tan(coercedArg)
    })
  }

  public atan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      return Math.atan(coercedArg)
    })
  }

  public ctg(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonTrigonometricFunction(ast, formulaAddress, (coercedArg) => {
      if (coercedArg === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return (1 / Math.tan(coercedArg))
      }
    })
  }

  private commonTrigonometricFunction(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (arg: number) => CellValue): CellValue {
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
