/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, EmptyValueType, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing COUNTUNIQUE function
 */
export class CountUniquePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'COUNTUNIQUE': {
      method: 'countunique',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.SCALAR},
        ],
        repeatLastArg: true,
        expandRanges: true,
      },
    },
  }

  /**
   * Corresponds to COUNTUNIQUE(Number1, Number2, ...).
   *
   * Returns number of unique numbers from arguments
   *
   * @param ast
   * @param formulaAddress
   */
  public countunique(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('COUNTUNIQUE'), (...args: InternalScalarValue[]) => {
      const valuesSet = new Set<number | string | boolean | EmptyValueType>()
      const errorsSet = new Set<ErrorType>()

      for (const scalarValue of args) {
        if (scalarValue instanceof CellError) {
          errorsSet.add(scalarValue.type)
        } else if (scalarValue !== '') {
          valuesSet.add(scalarValue)
        }
      }

      return valuesSet.size + errorsSet.size
    })
  }
}
