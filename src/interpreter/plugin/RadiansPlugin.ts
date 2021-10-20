/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class RadiansPlugin extends FunctionPlugin implements FunctionPluginTypecheck<RadiansPlugin> {
  public static implementedFunctions = {
    'RADIANS': {
      method: 'radians',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ],
    },
  }

  public radians(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('RADIANS'),
      (arg) => arg * (Math.PI / 180)
    )
  }
}
