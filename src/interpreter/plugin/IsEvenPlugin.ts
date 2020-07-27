/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class IsEvenPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISEVEN': {
      method: 'iseven',
      parameters: [
        { argumentType: 'number'}
      ]
    },
  }

  public iseven(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, IsEvenPlugin.implementedFunctions.ISEVEN,
      (val) => (val % 2 === 0)
    )
  }
}
