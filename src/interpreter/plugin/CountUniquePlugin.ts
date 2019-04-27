import {cellError, CellValue, ErrorType, isCellError, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing COUNTUNIQUE function
 */
export class CountUniquePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    countunique: {
      EN: 'COUNTUNIQUE',
      PL: 'COUNTUNIQUE',
    },
  }

  /**
   * Corresponds to COUNTUNIQUE(Number1, Number2, ...).
   *
   * Returns number of unique numbers from arguments
   *
   * @param ast
   * @param formulaAddress
   */
  public countunique(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length === 0) {
      return cellError(ErrorType.NA)
    }

    const values = this.computeNumericListOfValues(ast.args, formulaAddress)
    if (Array.isArray(values)) {
      values.sort((a, b) => (a - b))

      let uniqueValues = 1
      let previous = values[0]
      for (let i = 1; i < values.length; i++) {
        if (previous !== values[i]) {
          previous = values[i]
          uniqueValues++
        }
      }

      return uniqueValues
    } else {
      return values
    }
  }
}
