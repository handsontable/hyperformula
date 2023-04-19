/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class IsEvenPlugin extends FunctionPlugin implements FunctionPluginTypecheck<IsEvenPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'ISEVEN': {
      method: 'iseven',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
      ]
    },
  }

  public iseven(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISEVEN'),
      (val) => (val % 2 === 0)
    )
  }
}
