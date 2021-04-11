/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class ModuloPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'MOD': {
      method: 'mod',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
  }

  public mod(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('MOD'), (dividend: number, divisor: number) => {
      if (divisor === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return dividend % divisor
      }
    })
  }
}
