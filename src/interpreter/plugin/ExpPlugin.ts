/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class ExpPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ExpPlugin> {
  public static implementedFunctions = {
    'EXP': {
      method: 'exp',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
      ],
    },
  }

  /**
   * Corresponds to EXP(value)
   *
   * Calculates the exponent for basis e
   *
   * @param ast
   * @param state
   */
  public exp(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EXP'), Math.exp)
  }
}
