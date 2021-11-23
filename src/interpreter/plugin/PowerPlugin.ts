/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {AsyncInterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class PowerPlugin extends FunctionPlugin implements FunctionPluginTypecheck<PowerPlugin>{
  public static implementedFunctions = {
    'POWER': {
      method: 'power',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
  }

  public power(ast: ProcedureAst, state: InterpreterState): AsyncInterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('POWER'), Math.pow)
  }
}
