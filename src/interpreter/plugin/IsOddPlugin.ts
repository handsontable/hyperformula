/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class IsOddPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISODD': {
      method: 'isodd',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ]
    },
  }

  public isodd(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('ISODD'),
      (val) => (val % 2 === 1)
    )
  }
}
