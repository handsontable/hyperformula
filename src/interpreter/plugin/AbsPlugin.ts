/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {AsyncInterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class AbsPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AbsPlugin>{
  public static implementedFunctions = {
    'ABS': {
      method: 'abs',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
  }

  public abs(ast: ProcedureAst, state: InterpreterState): AsyncInterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ABS'), Math.abs)
  }
}
