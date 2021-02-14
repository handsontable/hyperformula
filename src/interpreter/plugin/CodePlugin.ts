/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class CodePlugin extends FunctionPlugin {
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

  public code(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CODE'), (value: string) => {
      if (value.length === 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
      }
      return value.charCodeAt(0)
    })
  }

  public unicode(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('UNICODE'), (value: string) => {
      return value.codePointAt(0) ?? new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
    })
  }
}
