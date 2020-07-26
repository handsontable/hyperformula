/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

const MAX_48BIT_INTEGER = 281474976710655
const SHIFT_MIN_POSITIONS = -53
const SHIFT_MAX_POSITIONS = 53

export class BitShiftPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'BITLSHIFT': {
      method: 'bitlshift',
      parameters: [
        { argumentType: 'integer', minValue: 0 },
        { argumentType: 'integer', minValue: SHIFT_MIN_POSITIONS, maxValue: SHIFT_MAX_POSITIONS },
      ]
    },
    'BITRSHIFT': {
      method: 'bitrshift',
      parameters: [
        { argumentType: 'integer', minValue: 0 },
        { argumentType: 'integer', minValue: SHIFT_MIN_POSITIONS, maxValue: SHIFT_MAX_POSITIONS },
      ]
    },
  }

  public bitlshift(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, BitShiftPlugin.implementedFunctions.BITLSHIFT, shiftLeft)
  }

  public bitrshift(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, BitShiftPlugin.implementedFunctions.BITRSHIFT, shiftRight)
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
    return new CellError(ErrorType.NUM)
  } else {
    return result
  }
}
