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

  public getAllVerticesFromSheet(sheetId: number): RangeVertex[] {
    const result = new Array()
    for (const rangeVertex of this.rangeMapping.values()) {
      if (rangeVertex.start.sheet === sheetId) {
        result.push(rangeVertex)
      }
    }
    return result
  }
}
