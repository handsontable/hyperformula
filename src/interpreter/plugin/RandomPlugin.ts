/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class RandomPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'RAND': {
      method: 'rand',
      parameters: [],
      isVolatile: true,
    },
    'RANDBETWEEN': {
      method: 'randbetween',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('RAND'), Math.random)
  }

  public randbetween(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('RANDBETWEEN'),
      (lower: number, upper: number) => {
        if(upper<lower) {
          return new CellError(ErrorType.NUM, ErrorMessage.WrongOrder)
        }
        lower = Math.ceil(lower)
        upper = Math.floor(upper)+1
        if(lower === upper) {
          upper += 1
        }
        return lower + Math.floor(Math.random()*(upper-lower))
      }
    )
  }
}
