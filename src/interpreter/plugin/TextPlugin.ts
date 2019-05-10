import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser/Ast'
import {concatenate} from '../text'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing text-specific functions
 */
export class TextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    concatenate: {
      EN: 'CONCATENATE',
      PL: 'ZLACZTEKST',
    },
    split: {
      EN: 'SPLIT',
      PL: 'PODZIELTEKST',
    },
  }

  /**
   * Corresponds to CONCATENATE(value1, [value2, ...])
   *
   * Concatenates provided arguments to one string.
   *
   * @param args
   * @param formulaAddress
   */
  public concatenate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const values = ast.args.map((arg) => this.evaluateAst(arg, formulaAddress))
    return concatenate(values)
  }

  /**
   * Corresponds to SPLIT(string, index)
   *
   * Splits provided string using space separator and returns chunk at zero-based position specified by second argument
   *
   * @param ast
   * @param formulaAddress
   */
  public split(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const stringArg = ast.args[0]
    const indexArg = ast.args[1]

    const stringToSplit = this.evaluateAst(stringArg, formulaAddress)
    if (typeof stringToSplit !== 'string') {
      return new CellError(ErrorType.VALUE)
    }
    const indexToUse = this.evaluateAst(indexArg, formulaAddress)
    if (typeof indexToUse !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    const splittedString = stringToSplit.split(' ')

    if (indexToUse > splittedString.length || indexToUse < 0) {
      return new CellError(ErrorType.VALUE)
    }

    return splittedString[indexToUse]
  }
}
