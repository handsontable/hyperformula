/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class ArrayFormulaPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayFormulaPlugin>{
  public static implementedFunctions = {
    'ARRAYFORMULA': {
      method: 'arrayformula',
      arrayFunction: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
  }

  public arrayformula(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYFORMULA'), (value) => value)
  }
}
