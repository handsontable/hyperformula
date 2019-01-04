import {SimpleCellAddress} from './Cell'
import {RangeVertex} from './Vertex'

/**
 * Mapping from address ranges to range vertices
 */
export class RangeMapping {
  private rangeMapping: Map<string, RangeVertex> = new Map()

  /**
   * Saves range vertex
   *
   * @param vertex - vertex to save
   */
  public setRange(vertex: RangeVertex) {
    const key = `${vertex.getStart().col},${vertex.getStart().row},${vertex.getEnd().col},${vertex.getEnd().row}`
    this.rangeMapping.set(key, vertex)
  }

  /**
   * Returns associated vertex for given range
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    const key = `${start.col},${start.row},${end.col},${end.row}`
    return this.rangeMapping.get(key) || null
  }
}
