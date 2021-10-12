/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class CodePlugin extends FunctionPlugin implements FunctionPluginTypecheck<CodePlugin> {
  public static implementedFunctions = {
    'CODE': {
      method: 'code',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'UNICODE': {
      method: 'unicode',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
  }

  public code(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CODE'), (value: string) => {
      if (value.length === 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
      }
      return value.charCodeAt(0)
    })
  }

  public unicode(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('UNICODE'), (value: string) => {
      return value.codePointAt(0) ?? new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
    })
  }
}
