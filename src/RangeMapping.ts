import {SimpleCellAddress} from './Cell'
import {RangeVertex} from './Vertex'

/**
 * Mapping from address ranges to range vertices
 */
export class RangeMapping {
  /** Map in which actual data is stored. */
  private rangeMapping: Map<string, RangeVertex> = new Map()

  /**
   * Saves range vertex
   *
   * @param vertex - vertex to save
   */
  public setRange(vertex: RangeVertex) {
    const key = `${vertex.getStart().sheet},${vertex.getStart().col},${vertex.getStart().row},${vertex.getEnd().col},${vertex.getEnd().row}`
    this.rangeMapping.set(key, vertex)
  }

  /**
   * Returns associated vertex for given range
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    const key = `${start.sheet},${start.col},${start.row},${end.col},${end.row}`
    return this.rangeMapping.get(key) || null
  }

  public shiftRanges(sheet: number, row: number, numberOfRows: number) {
    const updated = Array<RangeVertex>()

    for (const [key, range] of this.rangeMapping.entries()) {
      if (range.sheet === sheet) {
        if (row <= range.start.row) {
          range.start.row += numberOfRows
          range.end.row += numberOfRows
          updated.push(range)
          this.rangeMapping.delete(key)
        } else if (row > range.start.row && row <= range.end.row) {
          range.end.row += numberOfRows
          updated.push(range)
          this.rangeMapping.delete(key)
        }
      }
    }

    updated.forEach(range => {
      range.clear()
      this.setRange(range)
    })
  }
}
