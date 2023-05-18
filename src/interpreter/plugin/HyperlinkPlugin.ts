/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ProcedureAst} from '../../parser'

export class HyperlinkPlugin extends FunctionPlugin implements FunctionPluginTypecheck<HyperlinkPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'HYPERLINK': {
      method: 'hyperlink',
      parameters: [
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.STRING, optionalArg: true},
      ]
    },
  }

  public hyperlink(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HYPERLINK'), (url, linkLabel) => {
      ast.hyperlink = url
      return linkLabel ?? url
    })
  }
}
