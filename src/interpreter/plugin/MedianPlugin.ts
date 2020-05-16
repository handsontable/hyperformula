/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'MEDIAN': {
      method: 'median',
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
  public median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length === 0) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const values: number[] = []
    for (const scalarValue of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      if (scalarValue instanceof CellError) {
        return scalarValue
      } else if (typeof scalarValue === 'number') {
        values.push(scalarValue)
      }
    }

    if (values.length === 0) {
      return new CellError(ErrorType.NUM)
    }

    values.sort((a, b) => (a - b))

    if (values.length % 2 === 0) {
      return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
    } else {
      return values[Math.floor(values.length / 2)]
    }
  }
}
