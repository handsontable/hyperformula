/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class ExpPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'EXP': {
      method: 'exp',
      parameters:[
        { argumentType: ArgumentTypes.NUMBER }
      ],
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('EXP'), Math.exp)
  }
}
