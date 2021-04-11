/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class DegreesPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DEGREES': {
      method: 'degrees',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ]
    },
  }

  public degrees(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('DEGREES'),
      (arg) => arg * (180 / Math.PI)
    )
  }
}
