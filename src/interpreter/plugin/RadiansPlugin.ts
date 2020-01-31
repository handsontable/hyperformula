import { InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class RadiansPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    radians: {
      translationKey: 'RADIANS',
    },
  }

  public radians(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      return arg * (Math.PI/180)
    })
  }
}
