import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class SqrtPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    sqrt: {
      translationKey: 'SQRT',
    },
  }

  public sqrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (input: number) => {
      if (input < 0) {
        return new CellError(ErrorType.NUM)
      } else {
        return Math.sqrt(input)
      }
    })
  }
}
