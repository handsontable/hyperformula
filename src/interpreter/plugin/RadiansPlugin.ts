/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class RadiansPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'RADIANS': {
      method: 'radians',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ],
    },
  }

  public radians(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('RADIANS'),
      (arg) => arg * (Math.PI / 180)
    )
  }
}
