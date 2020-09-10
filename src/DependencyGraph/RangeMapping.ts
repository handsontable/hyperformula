/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {simpleCellAddress, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {Span} from '../Span'
import {RangeVertex} from './'

/**
 * Mapping from address ranges to range vertices
 */
export class RangeMapping {
  /** Map in which actual data is stored. */
  private rangeMapping: Map<number, Map<string, RangeVertex>> = new Map()

  public getMappingSize(sheet: number): Maybe<number> {
    return this.rangeMapping.get(sheet)?.size ?? 0
  }

  /**
   * Saves range vertex
   *
   * @param vertex - vertex to save
   */
  public setRange(vertex: RangeVertex) {
    let sheetMap = this.rangeMapping.get(vertex.getStart().sheet)
    if (sheetMap === undefined) {
      sheetMap = new Map()
      this.rangeMapping.set(vertex.getStart().sheet, sheetMap)
    }
    const key = keyFromAddresses(vertex.getStart(), vertex.getEnd())
    sheetMap.set(key, vertex)
  }

  public removeRange(vertex: RangeVertex) {
    const sheet = vertex.getStart().sheet
    const sheetMap = this.rangeMapping.get(sheet)
    if (sheetMap === undefined) {
      return
    }
    const key = keyFromAddresses(vertex.getStart(), vertex.getEnd())
    sheetMap.delete(key)
    if (sheetMap.size === 0) {
      this.rangeMapping.delete(sheet)
    }
  }

  /**
   * Returns associated vertex for given range
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): Maybe<RangeVertex> {
    const sheetMap = this.rangeMapping.get(start.sheet)
    const key = keyFromAddresses(start, end)
    return sheetMap?.get(key)
  }

  public fetchRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex {
    const maybeRange = this.getRange(start, end)
    if (!maybeRange) {
      throw Error('Range does not exist')
    }
    return maybeRange
  }

  public truncateRanges(span: Span, coordinate: (address: SimpleCellAddress) => number): TruncateRangesResult {
    const verticesToRemove = Array<RangeVertex>()
    const updated = Array<[string, RangeVertex]>()

    const sheet = span.sheet
    for (const [key, vertex] of this.entriesFromSheet(span.sheet)) {
      const range = vertex.range
      if (span.start <= coordinate(vertex.range.end)) {
        range.removeSpan(span)
        if (range.shouldBeRemoved()) {
          this.removeByKey(sheet, key)
          verticesToRemove.push(vertex)
        } else {
          updated.push([key, vertex])
        }
      }
    }

    const verticesToMerge: [RangeVertex, RangeVertex][] = []
    for (const [oldKey, vertex] of updated.sort((left, right) => compareBy(left[1], right[1], coordinate))) {
      const newKey = keyFromRange(vertex.range)
      if (newKey === oldKey) {
        continue
      }

      const existingVertex = this.getByKey(sheet, newKey)
      this.removeByKey(sheet, oldKey)
      if (existingVertex !== undefined && vertex != existingVertex) {
        verticesToMerge.push([existingVertex, vertex])
      } else {
        this.setRange(vertex)
      }
    }

    return {
      verticesToRemove,
      verticesToMerge
    }
  }

  public moveAllRangesInSheetAfterRowByRows(sheet: number, row: number, numberOfRows: number) {
    this.updateVerticesFromSheet(sheet, (key: string, vertex: RangeVertex): Maybe<RangeVertex> => {
      if (row <= vertex.start.row) {
        vertex.range.shiftByRows(numberOfRows)
        return vertex
      } else if (row > vertex.start.row && row <= vertex.end.row) {
        vertex.range.expandByRows(numberOfRows)
        return vertex
      } else {
        return undefined
      }
    })
  }

  public moveAllRangesInSheetAfterColumnByColumns(sheet: number, column: number, numberOfColumns: number) {
    this.updateVerticesFromSheet(sheet, (key: string, vertex: RangeVertex): Maybe<RangeVertex> => {
      if (column <= vertex.start.col) {
        vertex.range.shiftByColumns(numberOfColumns)
        return vertex
      } else if (column > vertex.start.col && column <= vertex.end.col) {
        vertex.range.expandByColumns(numberOfColumns)
        return vertex
      } else {
        return undefined
      }
    })
  }

  public moveRangesInsideSourceRange(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    this.updateVerticesFromSheet(sourceRange.sheet, (key: string, vertex: RangeVertex): Maybe<RangeVertex> => {
      if (sourceRange.containsRange(vertex.range)) {
        vertex.range.shiftByColumns(toRight)
        vertex.range.shiftByRows(toBottom)
        vertex.range.moveToSheet(toSheet)
        return vertex
      } else {
        return undefined
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

  /**
   * Finds smaller range does have own vertex.
   *
   * @param rangeMapping - range mapping dependency
   * @param ranges - ranges to find smaller range in
   */
  public findSmallerRange(range: AbsoluteCellRange): { smallerRangeVertex: RangeVertex | null, restRange: AbsoluteCellRange } {
    if (range.height() > 1 && Number.isFinite(range.height())) {
      const valuesRangeEndRowLess = simpleCellAddress(range.end.sheet, range.end.col, range.end.row - 1)
      const rowLessVertex = this.getRange(range.start, valuesRangeEndRowLess)
      if (rowLessVertex !== undefined) {
        const restRange = new AbsoluteCellRange(simpleCellAddress(range.start.sheet, range.start.col, range.end.row), range.end)
        return {
          smallerRangeVertex: rowLessVertex,
          restRange,
        }
      }
    }
    return {
      smallerRangeVertex: null,
      restRange: range,
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

  private getByKey(sheet: number, key: string): RangeVertex | undefined {
    return this.rangeMapping.get(sheet)?.get(key)
  }

  private updateVerticesFromSheet(sheet: number, fn: (key: string, vertex: RangeVertex) => Maybe<RangeVertex>) {
    const updated = Array<RangeVertex>()

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      const result = fn(key, vertex)
      if (result !== undefined) {
        this.removeByKey(sheet, key)
        updated.push(result)
      }
    }

    updated.forEach((range) => {
      this.setRange(range)
    })
  }
}

export interface TruncateRangesResult {
  verticesToRemove: RangeVertex[],
  verticesToMerge: [RangeVertex, RangeVertex][],
}

function keyFromAddresses(start: SimpleCellAddress, end: SimpleCellAddress): string {
  return `${start.col},${start.row},${end.col},${end.row}`
}

function keyFromRange(range: AbsoluteCellRange): string {
  return keyFromAddresses(range.start, range.end)
}

const compareBy = (left: RangeVertex, right: RangeVertex, coordinate: (address: SimpleCellAddress) => number) => {
  const leftStart = coordinate(left.range.start)
  const rightStart = coordinate(left.range.start)
  if (leftStart === rightStart) {
    const leftEnd = coordinate(left.range.end)
    const rightEnd = coordinate(right.range.end)
    return leftEnd - rightEnd
  } else {
    return leftStart - rightStart
  }
}
