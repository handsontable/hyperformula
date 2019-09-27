import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class RandomPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    rand: {
      translationKey: 'RAND',
      isVolatile: true,
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
  public rand(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 0) {
      return new CellError(ErrorType.NA)
    } else {
      return Math.random()
    }
  }
}
