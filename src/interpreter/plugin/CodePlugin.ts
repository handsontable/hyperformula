/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class CodePlugin extends FunctionPlugin implements FunctionPluginTypecheck<CodePlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'CODE': {
      method: 'code',
      parameters: [
        {argumentType: FunctionArgumentType.STRING}
      ]
    },
    'UNICODE': {
      method: 'unicode',
      parameters: [
        {argumentType: FunctionArgumentType.STRING}
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
