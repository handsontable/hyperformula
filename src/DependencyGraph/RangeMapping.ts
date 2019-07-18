import {SimpleCellAddress} from '../Cell'
import {RangeVertex} from './'

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

  public truncateRangesByRows(sheet: number, rowStart: number, rowEnd: number): RangeVertex[] {
    const updated = Array<RangeVertex>()
    const rangesToRemove = Array<RangeVertex>()

    for (const [key, vertex] of this.rangeMapping.entries()) {
      if (vertex.sheet == sheet && rowStart <= vertex.range.end.row) {
        vertex.range.removeRows(rowStart, rowEnd)
        if (vertex.range.height() > 0) {
          updated.push(vertex)
        } else {
          rangesToRemove.push(vertex)
        }
        this.rangeMapping.delete(key)
      }
    }

    updated.forEach((vertex) => {
      this.setRange(vertex)
    })

    return rangesToRemove
  }

  public truncateRangesByColumns(sheet: number, columnStart: number, columnEnd: number): RangeVertex[] {
    const updated = Array<RangeVertex>()
    const rangesToRemove = Array<RangeVertex>()

    for (const [key, vertex] of this.rangeMapping.entries()) {
      if (vertex.sheet == sheet && columnStart <= vertex.range.end.col) {
        vertex.range.removeColumns(columnStart, columnEnd)
        if (vertex.range.width() > 0) {
          updated.push(vertex)
        } else {
          rangesToRemove.push(vertex)
        }
        this.rangeMapping.delete(key)
      }
    }

    updated.forEach((vertex) => {
      this.setRange(vertex)
    })

    return rangesToRemove
  }

  public shiftRangesByRows(sheet: number, row: number, numberOfRows: number) {
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

    updated.forEach((range) => {
      this.setRange(range)
    })
  }

  public shiftRangesByColumns(sheet: number, column: number, numberOfColumns: number) {
    const updated = Array<RangeVertex>()

    for (const [key, vertex] of this.rangeMapping.entries()) {
      if (vertex.sheet === sheet) {
        if (column <= vertex.start.col) {
          vertex.range.shiftByColumns(numberOfColumns)
          updated.push(vertex)
          this.rangeMapping.delete(key)
        } else if (column > vertex.start.col && column <= vertex.end.col) {
          vertex.range.expandByColumns(numberOfColumns)
          updated.push(vertex)
          this.rangeMapping.delete(key)
        }
      }
    }

    updated.forEach((range) => {
      this.setRange(range)
    })
  }

  public* rangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    for (const range of this.rangeMapping.values()) {
      if (range.sheet === sheet) {
        yield range
      }
    }
  }
}
