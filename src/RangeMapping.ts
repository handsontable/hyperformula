import {SimpleCellAddress} from './Cell'
import {RangeVertex, Vertex} from './Vertex'

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

    for (const [key, vertex] of this.rangeMapping.entries()) {
      if (vertex.sheet === sheet) {
        if (row <= vertex.start.row) {
          vertex.range.shiftByRows(numberOfRows)
          updated.push(vertex)
          this.rangeMapping.delete(key)
        } else if (row > vertex.start.row && row <= vertex.end.row) {
          vertex.range.expandByRows(numberOfRows)
          updated.push(vertex)
          this.rangeMapping.delete(key)
        }
      }
    }

    updated.forEach(range => {
      range.clearCache()
      this.setRange(range)
    })
  }

  public getValues() {
    return this.rangeMapping.values()
  }
}
