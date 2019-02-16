import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    median: {
      EN: 'MEDIAN',
      PL: 'MEDIANA',
    },
  }

  /**
   * Corresponds to MEDIAN(Number1, Number2, ...).
   *
   * Returns a median of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public async median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): Promise<CellValue> {
    if (ast.args.length === 0) {
      return cellError(ErrorType.NA)
    }

    const values = await this.computeNumericListOfValues(ast.args, formulaAddress)

    if (Array.isArray(values)) {
      values.sort((a, b) => (a - b))

      if (values.length % 2 === 0) {
        return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
      } else {
        return values[Math.floor(values.length / 2)]
      }
    } else {
      return values
    }
  }
}
