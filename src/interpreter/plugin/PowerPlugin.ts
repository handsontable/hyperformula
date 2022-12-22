/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class PowerPlugin extends FunctionPlugin implements FunctionPluginTypecheck<PowerPlugin> {
  public static implementedFunctions = {
    'POWER': {
      method: 'power',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
    },
  }

  public power(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('POWER'), Math.pow)
  }
}
