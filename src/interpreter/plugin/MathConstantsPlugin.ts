/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export const PI = parseFloat(Math.PI.toFixed(14))

export class MathConstantsPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MathConstantsPlugin> {
  public static implementedFunctions = {
    'PI': {
      method: 'pi',
      parameters: [],
    },
    'SQRTPI': {
      method: 'sqrtpi',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0}
      ],
    },
  }

  public pi(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PI'),
      () => PI
    )
  }

  public sqrtpi(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SQRTPI'),
      (arg: number) => Math.sqrt(PI * arg)
    )
  }
}
