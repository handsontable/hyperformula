/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class IsOddPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISODD': {
      method: 'isodd',
      parameters: [
        { argumentType: 'number'}
      ]
    },
  }

  public isodd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, IsOddPlugin.implementedFunctions.ISODD,
      (val) => (val % 2 === 1)
    )
  }
}
