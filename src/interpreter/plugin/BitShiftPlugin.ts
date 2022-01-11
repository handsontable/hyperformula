/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

const MAX_48BIT_INTEGER = 281474976710655
const SHIFT_MIN_POSITIONS = -53
const SHIFT_MAX_POSITIONS = 53

export class BitShiftPlugin extends FunctionPlugin implements FunctionPluginTypecheck<BitShiftPlugin> {
  public static implementedFunctions = {
    'BITLSHIFT': {
      method: 'bitlshift',
      parameters: [
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: SHIFT_MIN_POSITIONS, maxValue: SHIFT_MAX_POSITIONS},
      ]
    },
    'BITRSHIFT': {
      method: 'bitrshift',
      parameters: [
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: SHIFT_MIN_POSITIONS, maxValue: SHIFT_MAX_POSITIONS},
      ]
    },
  }

  public bitlshift(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BITLSHIFT'), shiftLeft)
  }

  public bitrshift(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('BITRSHIFT'), shiftRight)
  }
}

function shiftLeft(value: number, positions: number): number | CellError {
  if (positions < 0) {
    return shiftRight(value, -positions)
  } else {
    return validate(value * Math.pow(2, positions))
  }
}

function shiftRight(value: number, positions: number): number | CellError {
  if (positions < 0) {
    return shiftLeft(value, -positions)
  } else {
    return validate(Math.floor(value / Math.pow(2, positions)))
  }
}

function validate(result: number): number | CellError {
  if (result > MAX_48BIT_INTEGER) {
    return new CellError(ErrorType.NUM, ErrorMessage.BitshiftLong)
  } else {
    return result
  }
}
