/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class SqrtPlugin extends FunctionPlugin implements FunctionPluginTypecheck<SqrtPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'SQRT': {
      method: 'sqrt',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
      ],
    },
  }

  public sqrt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SQRT'), Math.sqrt)
  }
}
