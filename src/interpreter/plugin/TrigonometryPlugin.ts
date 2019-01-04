import {FunctionPlugin} from "./FunctionPlugin";
import {ProcedureAst} from "../../parser/Ast";
import {cellError, CellValue, ErrorType, SimpleCellAddress} from "../../Cell";

export class TrigonometryPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'acos': {
      'EN': 'ACOS',
      'PL': 'ACOS',
    }
  }

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