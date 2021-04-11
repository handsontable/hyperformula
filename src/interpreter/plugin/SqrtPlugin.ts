/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class SqrtPlugin extends  FunctionPlugin implements FunctionPluginTypecheck<SqrtPlugin>{
  public static implementedFunctions = {
    'SQRT': {
      method: 'sqrt',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ],
    },
  }

  public sqrt(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('SQRT'), Math.sqrt)
  }
}
