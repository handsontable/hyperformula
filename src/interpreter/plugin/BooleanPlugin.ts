import {FunctionPlugin} from "./FunctionPlugin";
import {cellError, CellValue, ErrorType, SimpleCellAddress} from "../../Cell";
import {booleanRepresentation} from "../coerce";
import {ProcedureAst} from "../../parser/Ast";

export class BooleanPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'true': {
      'EN': 'TRUE',
      'PL': 'PRAWDA',
    },
    'false': {
      'EN': 'FALSE',
      'PL': 'FALSZ',
    },
    'if': {
      'EN': 'IF',
      'PL': 'JEZELI',
    },
    'and': {
      'EN': 'AND',
      'PL': 'ORAZ',
    },
    'or': {
      'EN': 'OR',
      'PL': 'LUB',
    }
  }


  public true(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length > 0) {
      return cellError(ErrorType.NA)
    } else {
      return true
    }
  }

  public false(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length > 0) {
      return cellError(ErrorType.NA)
    } else {
      return false
    }
  }

  public if(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const condition = booleanRepresentation(this.evaluateAst(ast.args[0], formulaAddress))
    if (condition === true) {
      return this.evaluateAst(ast.args[1], formulaAddress)
    } else if (condition === false) {
      if (ast.args[2]) {
        return this.evaluateAst(ast.args[2], formulaAddress)
      } else {
        return false
      }
    } else {
      return cellError(ErrorType.VALUE)
    }
  }

  public and(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return cellError(ErrorType.NA)
    }

    let result: CellValue = true
    let index = 0
    while (result === true && index < ast.args.length) {
      const argValue = this.evaluateAst(ast.args[index], formulaAddress)
      result = booleanRepresentation(argValue)
      ++index
    }
    return result
  }

  public or(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return cellError(ErrorType.NA)
    }

    let result: CellValue = false
    let index = 0
    while (result === false && index < ast.args.length) {
      const argValue = this.evaluateAst(ast.args[index], formulaAddress)
      result = booleanRepresentation(argValue)
      ++index
    }
    return result
  }
}