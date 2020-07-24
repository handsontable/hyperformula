/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, EmptyValueType, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing COUNTUNIQUE function
 */
export class CountUniquePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'COUNTUNIQUE': {
      method: 'countunique',
      parameters: [
        { argumentType: 'scalar' },
      ],
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
    return this.runFunctionWithRepeatedArg(ast.args, formulaAddress, CountUniquePlugin.implementedFunctions.COUNTUNIQUE.parameters, (...args: InternalScalarValue[]) => {
      const valuesSet = new Set<number | string | boolean | EmptyValueType>()
      const errorsSet = new Set<ErrorType>()

      for (const scalarValue  of args) {
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
