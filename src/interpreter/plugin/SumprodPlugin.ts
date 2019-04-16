import {
  cellError,
  CellValue,
  ErrorType,
  rangeHeight,
  rangeWidth,
  simpleCellAddress,
  SimpleCellAddress,
  AbsoluteCellRange,
} from '../../Cell'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser/Ast'
import {RangeMapping} from '../../RangeMapping'
import {RangeVertex} from '../../Vertex'
import {FunctionPlugin} from './FunctionPlugin'

function cacheKey(ranges: AbsoluteCellRange[]): string {
  return `SUMPROD,${ranges[1].start.col},${ranges[1].start.row}`
}

export class SumprodPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sumprod: {
      EN: 'SUMPROD',
      PL: 'SUMPROD',
    },
  }

  // SUMPORD(A1:A2; B1:B2, C1:C2);
  public sumprod(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const leftRange = ast.args[0]
    const rightRange = ast.args[1]

    if (leftRange.type !== AstNodeType.CELL_RANGE || rightRange.type !== AstNodeType.CELL_RANGE) {
      return cellError(ErrorType.VALUE)
    }

    const simpleLeftRange = AbsoluteCellRange.fromCellRange(leftRange, formulaAddress)
    const simpleRightRange = AbsoluteCellRange.fromCellRange(rightRange, formulaAddress)

    if (rangeWidth(simpleLeftRange) !== rangeWidth(simpleRightRange) || rangeHeight(simpleLeftRange) !== rangeHeight(simpleRightRange)) {
      return cellError(ErrorType.VALUE)
    }

    return this.evaluateSumprod(simpleLeftRange, simpleRightRange)
  }

  private evaluateSumprod(leftRange: AbsoluteCellRange, rightRange: AbsoluteCellRange): CellValue {
    const rangeVertex = this.rangeMapping.getRange(leftRange.start, leftRange.end)
    if (!rangeVertex) {
      throw new Error('Range does not exists in graph')
    }

    const ranges = [leftRange, rightRange]
    const result = this.findAlreadyCachedValue(rangeVertex, ranges) ||
      this.computeResultFromSmallerCache(ranges) ||
      this.computeResultFromAllValues(ranges)

    rangeVertex.setFunctionValue(cacheKey(ranges), result)
    return result
  }

  private findAlreadyCachedValue(rangeVertex: RangeVertex, ranges: AbsoluteCellRange[]) {
    return rangeVertex.getFunctionValue(cacheKey(ranges))
  }

  private computeResultFromSmallerCache(ranges: AbsoluteCellRange[]) {
    const {smallerRangeVertex, restRanges} = findSmallerRange(this.rangeMapping, ranges)

    if (smallerRangeVertex !== null) {
      const smallerValue = smallerRangeVertex.getFunctionValue(cacheKey(ranges))

      if (typeof smallerValue === 'number') {
        const restValue = this.reduceSumprod(restRanges.map((range) => this.getCellValuesFromRange(range)))
        const result = smallerValue + restValue
        return result
      }
    }
    return null
  }

  private computeResultFromAllValues(ranges: AbsoluteCellRange[]) {
    return this.reduceSumprod(ranges.map((range) => this.getCellValuesFromRange(range)))
  }

  private reduceSumprod(ranges: CellValue[][]): number {
    let result = 0
    for (let i = 0; i < ranges[0].length; ++i) {
      let prod = 1
      for (let j = 0; j < ranges.length; ++j) {
        const value = ranges[j][i]
        if (typeof value === 'number') {
          prod = prod * value
        } else {
          prod = 0
          break
        }
      }
      result += prod
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
export const findSmallerRange = (rangeMapping: RangeMapping, ranges: AbsoluteCellRange[]): { smallerRangeVertex: RangeVertex | null, restRanges: AbsoluteCellRange[] } => {
  if (ranges[0].height() > 1) {
    const valuesRangeEndRowLess = simpleCellAddress(ranges[0].end.sheet, ranges[0].end.col, ranges[0].end.row - 1)
    const rowLessVertex = rangeMapping.getRange(ranges[0].start, valuesRangeEndRowLess)
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
