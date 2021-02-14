/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class CharPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CHAR': {
      method: 'char',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ],
    },
    'UNICHAR': {
      method: 'unichar',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER}
      ],
    },
  }

  public char(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHAR'), (value: number) => {
      if (value < 1 || value >= 256) {
        return new CellError(ErrorType.VALUE, ErrorMessage.CharacterCodeBounds)
      }

      return String.fromCharCode(Math.trunc(value))
    })
  }

  public unichar(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHAR'), (value: number) => {
      if (value < 1 || value >= 1114112) {
        return new CellError(ErrorType.VALUE, ErrorMessage.CharacterCodeBounds)
      }

      return String.fromCodePoint(Math.trunc(value))
    })
  }
}
