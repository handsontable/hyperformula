import {cellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing trigonometric functions
 */
export class TrigonometryPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    acos: {
      EN: 'ACOS',
      PL: 'ACOS',
    },
  }

  /**
   * Corresponds to COS(value)
   *
   * Returns the arc cosine (or inverse cosine) of a number.
   *
   * @param ast
   * @param formulaAddress
   */
  public acos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return cellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (typeof arg !== 'number') {
      return cellError(ErrorType.VALUE)
    } else if (-1 <= arg && arg <= 1) {
      return Math.acos(arg)
    } else {
      return cellError(ErrorType.NUM)
    }
  }
}
