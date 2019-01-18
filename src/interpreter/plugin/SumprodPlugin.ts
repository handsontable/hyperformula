import {
  cellError, cellRangeToSimpleCellRange,
  CellValue,
  ErrorType,
  rangeHeight,
  rangeWidth,
  simpleCellAddress,
  SimpleCellAddress,
  simpleCellRange,
  SimpleCellRange,
} from '../../Cell'
import {generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser/Ast'
import {RangeMapping} from '../../RangeMapping'
import {RangeVertex} from '../../Vertex'
import {FunctionPlugin} from './FunctionPlugin'

function cacheKey(rightRange: SimpleCellRange): string {
  return `SUMPROD,${rightRange.start.col},${rightRange.start.row}`
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

    const simpleLeftRange = cellRangeToSimpleCellRange(leftRange, formulaAddress)
    const simpleRightRange = cellRangeToSimpleCellRange(rightRange, formulaAddress)

    if (rangeWidth(simpleLeftRange) !== rangeWidth(simpleRightRange) || rangeHeight(simpleLeftRange) !== rangeHeight(simpleRightRange)) {
      return cellError(ErrorType.VALUE)
    }

    return this.evaluateSumprod(simpleLeftRange, simpleRightRange)
  }

  private evaluateSumprod(leftRange: SimpleCellRange, rightRange: SimpleCellRange): CellValue {
    const rangeVertex = this.rangeMapping.getRange(leftRange.start, leftRange.end)
    if (!rangeVertex) {
      throw new Error('Range does not exists in graph')
    }

    const cachedValue = this.findAlreadyCachedValue(rangeVertex, rightRange)
    if (cachedValue) {
      return cachedValue
    }

    const result = this.computeResultFromSmallerCache(rangeVertex, leftRange, rightRange) ||
      this.computeResultFromAllValues(rangeVertex, leftRange, rightRange)

    rangeVertex.setFunctionValue(cacheKey(rightRange), result)
    return result
  }

  private findAlreadyCachedValue(rangeVertex: RangeVertex, rightRange: SimpleCellRange) {
    return rangeVertex.getFunctionValue(cacheKey(rightRange))
  }

  private computeResultFromSmallerCache(rangeVertex: RangeVertex, leftRange: SimpleCellRange, rightRange: SimpleCellRange) {
    const {smallerRangeVertex, restRanges} = findSmallerRange(this.rangeMapping, [leftRange, rightRange])

    if (smallerRangeVertex !== null) {
      const smallerValue = smallerRangeVertex.getFunctionValue(cacheKey(rightRange))

      if (typeof smallerValue === 'number') {
        const restValue = this.reduceSumprod(restRanges.map((range) => this.getCellValuesFromRange(range)))
        const result = smallerValue + restValue
        return result
      }
    }
    return null
  }

  private computeResultFromAllValues(rangeVertex: RangeVertex, leftRange: SimpleCellRange, rightRange: SimpleCellRange) {
    return this.reduceSumprod([leftRange, rightRange].map((range) => this.getCellValuesFromRange(range)))
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

export const findSmallerRange = (rangeMapping: RangeMapping, ranges: SimpleCellRange[]): { smallerRangeVertex: RangeVertex | null, restRanges: SimpleCellRange[] } => {
  if (ranges[0].end.row > ranges[0].start.row) {
    const valuesRangeEndRowLess = simpleCellAddress(ranges[0].end.col, ranges[0].end.row - 1)
    const rowLessVertex = rangeMapping.getRange(ranges[0].start, valuesRangeEndRowLess)
    if (rowLessVertex) {
      const restRanges = ranges.map((range) => {
        return simpleCellRange(simpleCellAddress(range.start.col, range.end.row), range.end)
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
