/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class AbsPlugin extends FunctionPlugin implements FunctionPluginTypecheck<AbsPlugin>{
  public static implementedFunctions = {
    'ABS': {
      method: 'abs',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
  }

  public abs(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('ABS'), Math.abs)
  }
}
