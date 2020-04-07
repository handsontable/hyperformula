/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, InternalCellValue, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {DependencyGraph, RangeVertex} from '../../DependencyGraph'
import {ProcedureAst} from '../../parser'
import {coerceToRange} from '../ArithmeticHelper'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class SumprodPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sumprod: {
      translationKey: 'SUMPRODUCT',
    },
  }

  public sumprod(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const [left, right] = ast.args

    const leftArgValue = coerceToRange(this.evaluateAst(left, formulaAddress))
    const rightArgValue = coerceToRange(this.evaluateAst(right, formulaAddress))

    if (leftArgValue.numberOfElements() !== rightArgValue.numberOfElements()) {
      return new CellError(ErrorType.VALUE)
    }

    return this.reduceSumprod(leftArgValue, rightArgValue)
  }

  private reduceSumprod(left: SimpleRangeValue, right: SimpleRangeValue): number | CellError {
    let result = 0

    const lit = left.valuesFromTopLeftCorner()
    const rit = right.valuesFromTopLeftCorner()
    let l, r

    while (l = lit.next(), r = rit.next(), !l.done && !r.done) {
      if (l.value instanceof CellError) {
        return l.value
      } else if (r.value instanceof CellError) {
        return r.value
      } else {
        const lval = this.coerceScalarToNumberOrError(l.value)
        const rval = this.coerceScalarToNumberOrError(r.value)
        if (typeof lval === 'number' && typeof rval === 'number') {
          result += lval * rval
        }
      }
    }

    return result
  }
}

/**
 * Finds smaller range does have own vertex.
 *
 * @param rangeMapping - range mapping dependency
 * @param ranges - ranges to find smaller range in
 */
export const findSmallerRange = (dependencyGraph: DependencyGraph, range: AbsoluteCellRange): { smallerRangeVertex: RangeVertex | null, restRange: AbsoluteCellRange } => {
  if (range.height() > 1 && Number.isFinite(range.height())) {
    const valuesRangeEndRowLess = simpleCellAddress(range.end.sheet, range.end.col, range.end.row - 1)
    const rowLessVertex = dependencyGraph.getRange(range.start, valuesRangeEndRowLess)
    if (rowLessVertex) {
      const restRange = new AbsoluteCellRange(simpleCellAddress(range.start.sheet, range.start.col, range.end.row), range.end)
      return {
        smallerRangeVertex: rowLessVertex,
        restRange,
      }
    }
  }
  return {
    smallerRangeVertex: null,
    restRange: range,
  }
}
