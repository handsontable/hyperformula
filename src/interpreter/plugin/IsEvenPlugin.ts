/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class IsEvenPlugin extends FunctionPlugin implements FunctionPluginTypecheck<IsEvenPlugin> {
  public static implementedFunctions = {
    'ISEVEN': {
      method: 'iseven',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ]
    },
  }

  public iseven(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISEVEN'),
      (val) => (val % 2 === 0)
    )
  }
}
