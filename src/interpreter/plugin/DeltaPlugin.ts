/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin implements FunctionPluginTypecheck<DeltaPlugin> {
  public static implementedFunctions = {
    'DELTA': {
      method: 'delta',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ]
    },
  }

  public delta(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DELTA'),
      (left: number, right: number) => (left === right ? 1 : 0)
    )
  }
}
