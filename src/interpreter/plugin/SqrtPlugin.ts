/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class SqrtPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'SQRT': {
      method: 'sqrt',
      parameters: { list: [
        { argumentType: 'number' }
      ]},
    },
  }

  public sqrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SQRT'), Math.sqrt)
  }
}
