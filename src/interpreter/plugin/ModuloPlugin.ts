/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class ModuloPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'MOD': {
      method: 'mod',
    },
  }

  public mod(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    const validationResult = this.validateTwoNumericArguments(ast, formulaAddress)
    if (validationResult instanceof CellError) {
      return validationResult
    }
    const [dividend, divisor] = validationResult

    if (divisor === 0) {
      return new CellError(ErrorType.DIV_BY_ZERO)
    }

    return dividend % divisor
  }
}
