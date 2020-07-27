/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DegreesPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DEGREES': {
      method: 'degrees',
      parameters: {
        list: [
          {argumentType: 'number'}
        ]
      },
    },
  }

  public degrees(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DEGREES'),
      (arg) => arg * (180 / Math.PI)
    )
  }
}
