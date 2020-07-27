/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class RandomPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'RAND': {
      method: 'rand',
      parameters: [],
      isVolatile: true,
    },
  }

  /**
   * Corresponds to RAND()
   *
   * Returns a pseudo-random floating-point random number
   * in the range [0,1).
   *
   * @param ast
   * @param formulaAddress
   */
  public rand(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RandomPlugin.implementedFunctions.RAND, Math.random)
  }
}
