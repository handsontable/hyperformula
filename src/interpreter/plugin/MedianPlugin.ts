/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'MEDIAN': {
      method: 'median',
      parameters: [
          {argumentType: ArgumentTypes.NOERROR},
        ],
        repeatLastArgs: 1,
        expandRanges: true,
    },
  }

  /**
   * Corresponds to MEDIAN(Number1, Number2, ...).
   *
   * Returns a median of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MEDIAN'), (...args) => {
      const values: number[] = args.filter((val: InternalScalarValue) => (typeof val === 'number'))
      if (values.length === 0) {
        return new CellError(ErrorType.NUM, 'Needs at least one value.')
      }
      values.sort((a, b) => (a - b))
      if (values.length % 2 === 0) {
        return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
      } else {
        return values[Math.floor(values.length / 2)]
      }
    })
  }
}
