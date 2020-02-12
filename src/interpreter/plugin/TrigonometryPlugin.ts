import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumberOrError} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

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
    atan2: {
      translationKey: 'ATAN2',
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
  public acos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      if (-1 <= coercedArg && coercedArg <= 1) {
        return Math.acos(coercedArg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public asin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      if (-1 <= coercedArg && coercedArg <= 1) {
        return Math.asin(coercedArg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public cos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      return Math.cos(coercedArg)
    })
  }

  public sin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      return Math.sin(coercedArg)
    })
  }

  public tan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      return Math.tan(coercedArg)
    })
  }

  public atan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      return Math.atan(coercedArg)
    })
  }

  public atan2(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const arg1 = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg1 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const arg2 = this.evaluateAst(ast.args[1], formulaAddress)
    if (arg2 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const coercedArg1 = coerceScalarToNumberOrError(arg1, this.interpreter.dateHelper)
    if (coercedArg1 instanceof CellError)  {
      return coercedArg1
    }
    const coercedArg2 = coerceScalarToNumberOrError(arg2, this.interpreter.dateHelper)
    if (coercedArg2 instanceof CellError) {
      return coercedArg2
    }
    return Math.atan2(coercedArg1, coercedArg2)
  }

  public ctg(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      if (coercedArg === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return (1 / Math.tan(coercedArg))
      }
    })
  }
}
