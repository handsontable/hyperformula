import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {SimpleRangeValue} from '../InterpreterValue'
import {coerceScalarToNumber} from '../coerce'

export class AbsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    abs: {
      translationKey: 'ABS',
    },
  }

  public abs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      return Math.abs(arg)
    })
  }
}
