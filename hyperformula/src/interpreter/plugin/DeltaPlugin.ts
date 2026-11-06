/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin implements FunctionPluginTypecheck<DeltaPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'DELTA': {
      method: 'delta',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
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

  public delta(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DELTA'),
      (left: number, right: number) => (left === right ? 1 : 0)
    )
  }

  /**
   * An empty `number` slot, as in `=GESTEP(,0)`, is #N/A, while an empty `step` counts as 0. The `step` is
   * checked first, so an error in it wins over an empty `number`, as it does over an error in `number`.
   */
  public gestep(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const numberIsEmptySlot = ast.args[0]?.type === AstNodeType.EMPTY
    return this.runFunction(ast.args, state, this.metadata('GESTEP'),
      (num: InternalScalarValue, step: InternalScalarValue) => {
        const b = this.coerceScalarToNumberRejectingBooleans(step)
        const a = numberIsEmptySlot ? new CellError(ErrorType.NA, ErrorMessage.EmptyArg) : this.coerceScalarToNumberRejectingBooleans(num)
        if (b instanceof CellError) {
          return b
        }
        return a instanceof CellError ? a : (getRawValue(a) >= getRawValue(b) ? 1 : 0)
      }
    )
  }
}
