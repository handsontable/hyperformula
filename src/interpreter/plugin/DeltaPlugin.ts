/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DELTA': {
      method: 'delta',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        ]
    },
  }

  public delta(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('DELTA'),
      (left: number, right: number) => (left === right ? 1 : 0)
    )
  }
}
