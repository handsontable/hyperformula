/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class PowerPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'POWER': {
      method: 'power',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
      ],
    },
  }

  public power(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, PowerPlugin.implementedFunctions.POWER, Math.pow)
  }
}
