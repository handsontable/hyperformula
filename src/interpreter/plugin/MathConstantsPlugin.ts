import {InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

const PI = parseFloat(Math.PI.toFixed(14))
const E = parseFloat(Math.E.toFixed(14))

export class MathConstantsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    pi: {
      translationKey: 'PI',
    },
    e: {
      translationKey: 'E',
    },
  }

  public pi(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return PI
  }

  public e(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return E
  }
}
