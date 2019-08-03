import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {RangeVertex} from './'

/**
 * Mapping from address ranges to range vertices
 */
export class RangeMapping {
  /** Map in which actual data is stored. */
  private rangeMapping: Map<number, Map<string, RangeVertex>> = new Map()

  /**
   * Saves range vertex
   *
   * @param vertex - vertex to save
   */
  public setRange(vertex: RangeVertex) {
    let sheetMap = this.rangeMapping.get(vertex.getStart().sheet)
    if (!sheetMap) {
      sheetMap = new Map()
      this.rangeMapping.set(vertex.getStart().sheet, sheetMap)
    }
    const key = `${vertex.getStart().col},${vertex.getStart().row},${vertex.getEnd().col},${vertex.getEnd().row}`
    sheetMap.set(key, vertex)
  }

  /**
   * Returns associated vertex for given range
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    const sheetMap = this.rangeMapping.get(start.sheet)
    if (!sheetMap) {
      return null
    }
    const key = `${start.col},${start.row},${end.col},${end.row}`
    return sheetMap.get(key) || null
  }

  public truncateRangesByRows(sheet: number, rowStart: number, rowEnd: number): RangeVertex[] {
    const updated = Array<RangeVertex>()
    const rangesToRemove = Array<RangeVertex>()

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      if (rowStart <= vertex.range.end.row) {
        vertex.range.removeRows(rowStart, rowEnd)
        if (vertex.range.height() > 0) {
          updated.push(vertex)
        } else {
          rangesToRemove.push(vertex)
        }
        this.removeByKey(sheet, key)
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

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      if (columnStart <= vertex.range.end.col) {
        vertex.range.removeColumns(columnStart, columnEnd)
        if (vertex.range.width() > 0) {
          updated.push(vertex)
        } else {
          rangesToRemove.push(vertex)
        }
        this.removeByKey(sheet, key)
      }
    }

    updated.forEach((vertex) => {
      this.setRange(vertex)
    })

    return rangesToRemove
  }

  public shiftRangesByRows(sheet: number, row: number, numberOfRows: number) {
    const updated = Array<RangeVertex>()

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      if (row <= vertex.start.row) {
        vertex.range.shiftByRows(numberOfRows)
        updated.push(vertex)
        this.removeByKey(sheet, key)
      } else if (row > vertex.start.row && row <= vertex.end.row) {
        vertex.range.expandByRows(numberOfRows)
        updated.push(vertex)
        this.removeByKey(sheet, key)
      }
    }

    updated.forEach((range) => {
      this.setRange(range)
    })
  }

  public shiftRangesByColumns(sheet: number, column: number, numberOfColumns: number) {
    const updated = Array<RangeVertex>()

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      if (column <= vertex.start.col) {
        vertex.range.shiftByColumns(numberOfColumns)
        updated.push(vertex)
        this.removeByKey(sheet, key)
      } else if (column > vertex.start.col && column <= vertex.end.col) {
        vertex.range.expandByColumns(numberOfColumns)
        updated.push(vertex)
        this.removeByKey(sheet, key)
      }
    }

    updated.forEach((range) => {
      this.setRange(range)
    })
  }

  public moveRangesInsideSourceRange(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    const updated = Array<RangeVertex>()

    for (const [key, vertex] of this.entriesFromSheet(sourceRange.sheet)) {
      if (sourceRange.containsRange(vertex.range)) {
        vertex.range.shiftByColumns(toRight)
        vertex.range.shiftByRows(toBottom)
        vertex.range.moveToSheet(toSheet)
        this.removeByKey(sourceRange.sheet, key)
        updated.push(vertex)
      }
    }

    updated.forEach((range) => {
      this.setRange(range)
    })
  }

  public* rangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.values()
  }

  public* entriesFromSheet(sheet: number): IterableIterator<[string, RangeVertex]> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.entries()
  }

  public* rangeVerticesContainedInRange(sourceRange: AbsoluteCellRange): IterableIterator<RangeVertex> {
    for (const rangeVertex of this.rangesInSheet(sourceRange.sheet)) {
      if (sourceRange.containsRange(rangeVertex.range)) {
        yield rangeVertex
      }
    }
  }

  private removeByKey(sheet: number, key: string) {
    this.rangeMapping.get(sheet)!.delete(key)
  }
}
