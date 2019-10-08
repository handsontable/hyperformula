import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../../Cell'
import {DependencyGraph, RangeVertex} from '../../DependencyGraph'
import {Matrix} from '../../Matrix'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {InterpreterValue} from '../InterpreterValue'

export class SumprodPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sumprod: {
      translationKey: 'SUMPRODUCT',
    },
  }

  public sumprod(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const [left, right] = ast.args

    const leftArg: InterpreterValue | AbsoluteCellRange = left.type === AstNodeType.CELL_RANGE
            ? AbsoluteCellRange.fromCellRange(left, formulaAddress)
            : this.evaluateAst(left, formulaAddress)

    const rightArg: InterpreterValue | AbsoluteCellRange = right.type === AstNodeType.CELL_RANGE
        ? AbsoluteCellRange.fromCellRange(right, formulaAddress)
        : this.evaluateAst(right, formulaAddress)

    if (typeof leftArg === 'number' && typeof rightArg === 'number') {
      return leftArg * rightArg
    } else if (!(leftArg instanceof AbsoluteCellRange) && !(leftArg instanceof Matrix)) {
      return new CellError(ErrorType.VALUE)
    } else if (!(rightArg instanceof AbsoluteCellRange) && !(rightArg instanceof Matrix)) {
      return new CellError(ErrorType.VALUE)
    }

    if ((leftArg.width() * leftArg.height()) !== (rightArg.width() * rightArg.height())) {
      return new CellError(ErrorType.VALUE)
    }

    return this.reduceSumprod(this.generateCellValues(leftArg), this.generateCellValues(rightArg))
  }

  private reduceSumprod(left: IterableIterator<CellValue>, right: IterableIterator<CellValue>): number {
    let result = 0

    let l, r
    while (l = left.next(), r = right.next(), !l.done, !r.done) {
      if (typeof l.value === 'number' && typeof r.value === 'number') {
        result += l.value * r.value
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
