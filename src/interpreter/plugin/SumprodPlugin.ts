import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, InternalCellValue, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {DependencyGraph, RangeVertex} from '../../DependencyGraph'
import {ProcedureAst} from '../../parser'
import {coerceToRange} from '../coerce'
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
export const findSmallerRange = (dependencyGraph: DependencyGraph, ranges: AbsoluteCellRange[]): { smallerRangeVertex: RangeVertex | null, restRanges: AbsoluteCellRange[] } => {
  if (ranges[0].height() > 1) {
    const valuesRangeEndRowLess = simpleCellAddress(ranges[0].end.sheet, ranges[0].end.col, ranges[0].end.row - 1)
    const rowLessVertex = dependencyGraph.getRange(ranges[0].start, valuesRangeEndRowLess)
    if (rowLessVertex) {
      const restRanges = ranges.map((range) => {
        return new AbsoluteCellRange(simpleCellAddress(range.start.sheet, range.start.col, range.end.row), range.end)
      })

      return {
        smallerRangeVertex: rowLessVertex,
        restRanges,
      }
    }
  }
  return {
    smallerRangeVertex: null,
    restRanges: ranges,
  }
}
