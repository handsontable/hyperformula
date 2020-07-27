/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class ExpPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'EXP': {
      method: 'exp',
      parameters: { list: [
        { argumentType: 'number' }
      ]},
    },
  }

  /**
   * Corresponds to EXP(value)
   *
   * Calculates the exponent for basis e
   *
   * @param ast
   * @param formulaAddress
   */
  public exp(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('EXP'), Math.exp)
  }
}
