import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToString} from '../coerce'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing text-specific functions
 */
export class TextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    concatenate: {
      translationKey: 'CONCATENATE',
    },
    split: {
      translationKey: 'SPLIT',
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
    if (ast.args.length == 0) {
      return new CellError(ErrorType.NA)
    }

    let result = ''
    for (const value of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      const coercedValue = coerceScalarToString(value)
      if (coercedValue instanceof CellError) {
        return value
      } else {
        result = result.concat(coercedValue)
      }
    }
    return result
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
