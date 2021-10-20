/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class SqrtPlugin extends FunctionPlugin implements FunctionPluginTypecheck<SqrtPlugin> {
  public static implementedFunctions = {
    'SQRT': {
      method: 'sqrt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ],
    },
  }

  public sqrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SQRT'), Math.sqrt)
  }
}
