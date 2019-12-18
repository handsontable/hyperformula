import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {RowsSpan} from '../RowsSpan'
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

  public fetchRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex {
    const maybeRange = this.getRange(start, end)
    if (!maybeRange) {
      throw Error('Range does not exist')
    }
    return maybeRange
  }

  public truncateRangesByRows(rowsSpan: RowsSpan): RangeVertex[] {
    const rangesToRemove = Array<RangeVertex>()

    this.updateVerticesFromSheet(rowsSpan.sheet, (key: string, vertex: RangeVertex): RangeVertex | void => {
      if (rowsSpan.rowStart <= vertex.range.end.row) {
        vertex.range.removeRows(rowsSpan.rowStart, rowsSpan.rowEnd)
        if (vertex.range.height() > 0) {
          return vertex
        } else {
          rangesToRemove.push(vertex)
          this.removeByKey(rowsSpan.sheet, key)
        }
      }
    })

    return rangesToRemove
  }

  public truncateRangesByColumns(columnsSpan: ColumnsSpan): RangeVertex[] {
    const rangesToRemove = Array<RangeVertex>()

    this.updateVerticesFromSheet(columnsSpan.sheet, (key: string, vertex: RangeVertex): RangeVertex | void => {
      if (columnsSpan.columnStart <= vertex.range.end.col) {
        vertex.range.removeColumns(columnsSpan.columnStart, columnsSpan.columnEnd)
        if (vertex.range.width() > 0) {
          return vertex
        } else {
          rangesToRemove.push(vertex)
          this.removeByKey(columnsSpan.sheet, key)
        }
      }
    })

    return rangesToRemove
  }

  public moveAllRangesInSheetAfterRowByRows(sheet: number, row: number, numberOfRows: number) {
    this.updateVerticesFromSheet(sheet, (key: string, vertex: RangeVertex): RangeVertex | void => {
      if (row <= vertex.start.row) {
        vertex.range.shiftByRows(numberOfRows)
        return vertex
      } else if (row > vertex.start.row && row <= vertex.end.row) {
        vertex.range.expandByRows(numberOfRows)
        return vertex
      }
    })
  }

  public moveAllRangesInSheetAfterColumnByColumns(sheet: number, column: number, numberOfColumns: number) {
    this.updateVerticesFromSheet(sheet, (key: string, vertex: RangeVertex): RangeVertex | void => {
      if (column <= vertex.start.col) {
        vertex.range.shiftByColumns(numberOfColumns)
        return vertex
      } else if (column > vertex.start.col && column <= vertex.end.col) {
        vertex.range.expandByColumns(numberOfColumns)
        return vertex
      }
    })
  }

  public moveRangesInsideSourceRange(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    this.updateVerticesFromSheet(sourceRange.sheet, (key: string, vertex: RangeVertex): RangeVertex | void => {
      if (sourceRange.containsRange(vertex.range)) {
        vertex.range.shiftByColumns(toRight)
        vertex.range.shiftByRows(toBottom)
        vertex.range.moveToSheet(toSheet)
        return vertex
      }
    })
  }

  public removeRangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    if (this.rangeMapping.has(sheet)) {
      const ranges = this.rangeMapping.get(sheet)!.values()
      this.rangeMapping.delete(sheet)
      return ranges
    }
    return [][Symbol.iterator]()
  }

  public* rangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.values()
  }

  public* rangeVerticesContainedInRange(sourceRange: AbsoluteCellRange): IterableIterator<RangeVertex> {
    for (const rangeVertex of this.rangesInSheet(sourceRange.sheet)) {
      if (sourceRange.containsRange(rangeVertex.range)) {
        yield rangeVertex
      }
    }
  }

  public destroy(): void {
    this.rangeMapping.clear()
  }

  private* entriesFromSheet(sheet: number): IterableIterator<[string, RangeVertex]> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.entries()
  }

  private removeByKey(sheet: number, key: string) {
    this.rangeMapping.get(sheet)!.delete(key)
  }

  private updateVerticesFromSheet(sheet: number, fn: (key: string, vertex: RangeVertex) => RangeVertex | void) {
    const updated = Array<RangeVertex>()

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      const result = fn(key, vertex)
      if (result) {
        this.removeByKey(sheet, key)
        updated.push(result)
      }
    }

    updated.forEach((range) => {
      this.setRange(range)
    })
  }
}
