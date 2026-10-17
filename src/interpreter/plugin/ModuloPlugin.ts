/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class ModuloPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ModuloPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'MOD': {
      method: 'mod',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
    },
  }

  public mod(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MOD'), (dividend: number, divisor: number) => {
      if (divisor === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }

      return flooredRemainder(dividend, divisor)
    })
  }
}

/**
 * Computes the remainder of a division, taking the sign of the divisor.
 *
 * This is the floored remainder, i.e. the one left by a division rounded towards negative infinity.
 * It is what Excel, Google Sheets and the OpenDocument specification define MOD to return. The `%`
 * operator computes the truncated remainder instead, which takes the sign of the dividend: the two
 * agree whenever the arguments share a sign, and differ by exactly one divisor when they do not.
 *
 * Correcting the remainder given by `%` is more verbose than the two textbook one-liners, but neither
 * of those is accurate enough for a calculation engine:
 * - `dividend - divisor * Math.floor(dividend / divisor)` rounds twice, and the multiplication scales
 *   the error of the division back up. It returns 0 instead of 2 for a dividend of 1e308 and a divisor
 *   of 3, and overflows to -Infinity for a dividend of Number.MAX_VALUE.
 * - `((dividend % divisor) + divisor) % divisor` loses the remainder entirely when it is negligible
 *   next to the divisor, returning 0 instead of 1e-20 for a divisor of 3, and overflows to NaN when the
 *   intermediate sum exceeds Number.MAX_VALUE.
 *
 * `%` on its own is exact for IEEE 754 doubles, so applying the correction only where it is needed
 * keeps every already-correct result untouched.
 *
 * @param {number} dividend - the number being divided
 * @param {number} divisor - the number to divide by, must not be 0
 */
function flooredRemainder(dividend: number, divisor: number): number {
  const truncatedRemainder = dividend % divisor
  const isDivisibleExactly = truncatedRemainder === 0
  const hasSignOfDivisor = (truncatedRemainder < 0) === (divisor < 0)

  if (isDivisibleExactly || hasSignOfDivisor) {
    return truncatedRemainder
  }

  return truncatedRemainder + divisor
}
