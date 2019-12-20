import {CellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

const PI = parseFloat(Math.PI.toFixed(14))

export class MathConstantsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    pi: {
      translationKey: 'PI',
    },
  }

  public pi(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return PI
  }
}
