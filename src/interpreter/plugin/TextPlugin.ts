import {Ast, ProcedureAst} from "../../parser/Ast";
import {cellError, CellValue, ErrorType, isCellError, SimpleCellAddress} from "../../Cell";
import {Interpreter} from "../Interpreter";
import {IAddressMapping} from "../../IAddressMapping";
import {RangeMapping} from "../../RangeMapping";
import {Graph} from "../../Graph";
import {Vertex} from "../../Vertex";
import {FunctionPlugin} from "./FunctionPlugin";

export class TextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'concatenate': {
      'EN': 'CONCATENATE',
      'PL': 'ZLACZTEKST',
    },
    'split': {
      'EN': 'SPLIT',
      'PL': 'PODZIELTEKST'
    }
  }

  /**
   * Concatenate values of arguments.
   *
   * @param args
   * @param formulaAddress
   */
  public concatenate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return ast.args.reduce((acc: CellValue, arg: Ast) => {
      const argResult = this.evaluateAst(arg, formulaAddress)
      if (isCellError(acc)) {
        return acc
      } else if (isCellError(argResult)) {
        return argResult
      } else {
        return (acc as string).concat(argResult.toString())
      }
    }, '')
  }

  public split(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const stringArg = ast.args[0]
    const indexArg = ast.args[1]

    const stringToSplit = this.evaluateAst(stringArg, formulaAddress)
    if (typeof stringToSplit !== 'string') {
      return cellError(ErrorType.VALUE)
    }
    const indexToUse = this.evaluateAst(indexArg, formulaAddress)
    if (typeof indexToUse !== 'number') {
      return cellError(ErrorType.VALUE)
    }

    const splittedString = stringToSplit.split(' ')

    if (indexToUse > splittedString.length || indexToUse < 0) {
      return cellError(ErrorType.VALUE)
    }

    return splittedString[indexToUse]
  }
}