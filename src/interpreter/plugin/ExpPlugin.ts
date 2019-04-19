import {FunctionPlugin} from "./FunctionPlugin";
import {ProcedureAst} from "../../parser/Ast";
import {cellError, CellValue, ErrorType, SimpleCellAddress} from "../../Cell";

export class ExpPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    exp: {
      EN: 'EXP',
      PL: 'EXP',
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
      return cellError(ErrorType.NA)
    } else {
      const arg = this.evaluateAst(ast.args[0], formulaAddress)

      if (typeof arg !== 'number') {
        return cellError(ErrorType.VALUE)
      }

      return Math.exp(arg)
    }
  }
}
