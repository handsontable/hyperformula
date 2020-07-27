/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DELTA': {
      method: 'delta',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
  }

  public delta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, DeltaPlugin.implementedFunctions.DELTA,
      (left: number, right: number) => (left === right ? 1 : 0)
    )
  }
}
