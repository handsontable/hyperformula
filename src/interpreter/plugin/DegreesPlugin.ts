/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class DegreesPlugin extends FunctionPlugin implements FunctionPluginTypecheck<DegreesPlugin> {
  public static implementedFunctions = {
    'DEGREES': {
      method: 'degrees',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ]
    },
  }

  public degrees(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DEGREES'),
      (arg) => arg * (180 / Math.PI)
    )
  }
}
