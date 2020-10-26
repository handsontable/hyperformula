/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class PowerPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'POWER': {
      method: 'power',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
  }

  public power(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('POWER'), Math.pow)
  }
}
