/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InternalScalarValue, RawScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class CountBlankPlugin extends FunctionPlugin implements FunctionPluginTypecheck<CountBlankPlugin>{

  public static implementedFunctions = {
    'COUNTBLANK': {
      method: 'countblank',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
  }

  public countblank(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('COUNTBLANK'), (...args: RawScalarValue[]) => {
      let counter = 0
      args.forEach((arg) => {
        if(arg === EmptyValue) {
          counter++
        }
      })
      return counter
    })
  }
}
