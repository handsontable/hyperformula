/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import { InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class ExpPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'EXP': {
      method: 'exp',
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
  public exp(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      return Math.exp(arg)
    })
  }
}
