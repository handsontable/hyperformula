/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessages} from '../../error-messages'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class CharPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CHAR': {
      method: 'char',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 1, maxValue: 255}
        ],
    },
  }

  public char(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHAR'), (value: number) => {
      if (value < 1 || value >= 256) {
        return new CellError(ErrorType.VALUE, ErrorMessages.CharacterCode)
      }

      return String.fromCharCode(Math.trunc(value))
    })
  }
}
