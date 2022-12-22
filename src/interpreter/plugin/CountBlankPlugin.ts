/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InterpreterValue, RawScalarValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class CountBlankPlugin extends FunctionPlugin implements FunctionPluginTypecheck<CountBlankPlugin> {

  public static implementedFunctions = {
    'COUNTBLANK': {
      method: 'countblank',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
  }

  public countblank(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('COUNTBLANK'), (...args: RawScalarValue[]) => {
      let counter = 0
      args.forEach((arg) => {
        if (arg === EmptyValue) {
          counter++
        }
      })
      return counter
    })
  }
}
