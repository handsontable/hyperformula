/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValueType, InterpreterValue, RawScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing COUNTUNIQUE function
 */
export class CountUniquePlugin extends FunctionPlugin implements FunctionPluginTypecheck<CountUniquePlugin> {
  public static implementedFunctions = {
    'COUNTUNIQUE': {
      method: 'countunique',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
  }

  /**
   * Corresponds to COUNTUNIQUE(Number1, Number2, ...).
   *
   * Returns number of unique numbers from arguments
   *
   * @param ast
   * @param state
   */
  public countunique(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('COUNTUNIQUE'), (...args: RawScalarValue[]) => {
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
