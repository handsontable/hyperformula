/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class CodePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CODE': {
      method: 'code',
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
}
