/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class AbsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ABS': {
      method: 'abs',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
  }

  public abs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ABS'), Math.abs)
  }
}
