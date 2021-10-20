/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class IsOddPlugin extends FunctionPlugin implements FunctionPluginTypecheck<IsOddPlugin> {
  public static implementedFunctions = {
    'ISODD': {
      method: 'isodd',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ]
    },
  }

  public isodd(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISODD'),
      (val) => (val % 2 === 1)
    )
  }
}
