/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin implements FunctionPluginTypecheck<DeltaPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'DELTA': {
      method: 'delta',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ]
    },
    'GESTEP': {
      method: 'gestep',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ]
    },
  }

  /**
   * Converts an argument the way Excel does for these functions: numbers, dates, numeric text and empty cells are
   * accepted, while a boolean or the empty text is #VALUE!. Errors are passed on.
   */
  private strictNumber(value: InternalScalarValue): number | CellError {
    if (value instanceof CellError) {
      return value
    }
    if (typeof value === 'boolean' || value === '') {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
    }
    const coerced = this.coerceScalarToNumberOrError(value)
    return coerced instanceof CellError ? coerced : getRawValue(coerced)
  }

  public delta(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DELTA'),
      (left: InternalScalarValue, right: InternalScalarValue) => {
        const a = this.strictNumber(left)
        const b = this.strictNumber(right)
        if (a instanceof CellError) {
          return a
        }
        return b instanceof CellError ? b : (a === b ? 1 : 0)
      }
    )
  }

  public gestep(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('GESTEP'),
      (num: InternalScalarValue, step: InternalScalarValue) => {
        const a = this.strictNumber(num)
        const b = this.strictNumber(step)
        if (a instanceof CellError) {
          return a
        }
        return b instanceof CellError ? b : (a >= b ? 1 : 0)
      }
    )
  }
}
