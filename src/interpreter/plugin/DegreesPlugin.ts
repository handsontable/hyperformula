import {InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DegreesPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    degrees: {
      translationKey: 'DEGREES',
    },
  }

  public degrees(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      return arg * (180 / Math.PI)
    })
  }
}
