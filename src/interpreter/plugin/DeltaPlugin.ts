import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    delta: {
      translationKey: 'DELTA',
    },
  }

  public delta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    const left = this.getNumericArgument(ast, formulaAddress, 0)
    if (left instanceof CellError) {
      return left
    }

    let right: number | CellError = 0
    if (ast.args.length === 2) {
      right = this.getNumericArgument(ast, formulaAddress, 1)
      if (right instanceof CellError) {
        return right
      }
    }

    return left === right ? 1 : 0
  }
}
