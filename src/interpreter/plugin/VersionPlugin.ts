/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {HyperFormula} from '../../HyperFormula'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class VersionPlugin extends FunctionPlugin implements FunctionPluginTypecheck<VersionPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'VERSION': {
      method: 'version',
      parameters: [],
    },
  }

  public version(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VERSION'), () => {
      return `HyperFormula v${HyperFormula.version}`
    })
  }
}
