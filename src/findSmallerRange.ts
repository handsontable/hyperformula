import {RangeMapping} from "./RangeMapping";
import {simpleCellAddress, simpleCellRange, SimpleCellRange} from "./Cell";
import {RangeVertex} from "./Vertex";

/**
 * Finds smaller range does have own vertex.
 *
 * @param rangeMapping - range mapping dependency
 * @param ranges - ranges to find smaller range in
 */
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