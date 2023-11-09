/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class IsOddPlugin extends FunctionPlugin implements FunctionPluginTypecheck<IsOddPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'ISODD': {
      method: 'isodd',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
      ]
    },
  }

  public isodd(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISODD'),
      (val) => (val % 2 === 1)
    )
  }
}
