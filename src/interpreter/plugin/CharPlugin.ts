/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class CharPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CHAR': {
      method: 'char',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ],
    },
  }

  public char(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CHAR'), (value: number) => {
      if (value < 1 || value > 255) {
        return new CellError(ErrorType.NUM)
      }

      return String.fromCharCode(value)
    })
  }
}
