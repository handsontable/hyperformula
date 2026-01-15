/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValueType, getRawPrecisionValue, InterpreterValue, isExtendedNumber, RawScalarValue, toNativeNumeric} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Interpreter plugin containing COUNTUNIQUE function
 */
export class CountUniquePlugin extends FunctionPlugin implements FunctionPluginTypecheck<CountUniquePlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'COUNTUNIQUE': {
      method: 'countunique',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
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
          // Convert Numeric to native number for Set uniqueness comparison
          if (isExtendedNumber(scalarValue)) {
            valuesSet.add(toNativeNumeric(getRawPrecisionValue(scalarValue)))
          } else {
            valuesSet.add(scalarValue)
          }
        }
      }

      return valuesSet.size + errorsSet.size
    })
  }
}
