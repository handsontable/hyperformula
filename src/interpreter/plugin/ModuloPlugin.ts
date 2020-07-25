/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class ModuloPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'MOD': {
      method: 'mod',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
      ],
    },
  }

  public mod(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, ModuloPlugin.implementedFunctions.MOD, (dividend: number, divisor: number) => {
      if (divisor === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return dividend % divisor
      }
    })
  }
}
