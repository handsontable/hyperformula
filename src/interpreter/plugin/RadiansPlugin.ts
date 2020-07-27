/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class RadiansPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'RADIANS': {
      method: 'radians',
      parameters: { list: [
        { argumentType: 'number' }
      ]},
    },
  }

  public radians(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('RADIANS'),
      (arg) => arg * (Math.PI / 180)
    )
  }
}
